using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Citas;

public record CitaDto(
    int Id,
    int ProspectoId, string Prospecto, string? Empresa,
    int EmpleadoId, string Empleado, string ColorEmpleado,
    int? AccionActividadId, string? AccionActividad,
    DateTime FechaHoraInicio, DateTime FechaHoraFin, int DuracionMinutos,
    EstatusCita Estatus, string? Notas)
{
    /// <summary>Requiere Prospecto, Empleado y AccionActividad cargados (Include).</summary>
    public static CitaDto Desde(Cita c) => new(
        c.Id,
        c.ProspectoId, c.Prospecto?.NombreCompleto ?? "", c.Prospecto?.Empresa,
        c.EmpleadoId, c.Empleado?.NombreCompleto ?? "", c.Empleado?.ColorAgenda ?? "#3b82f6",
        c.AccionActividadId, c.AccionActividad?.Nombre,
        c.FechaHoraInicio, c.FechaHoraFin, c.DuracionMinutos,
        c.Estatus, c.Notas);
}

public class GuardarCitaRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Selecciona un prospecto.")]
    public int ProspectoId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Selecciona un empleado.")]
    public int EmpleadoId { get; set; }

    public int? AccionActividadId { get; set; }

    [Required]
    public DateTime FechaHoraInicio { get; set; }

    /// <summary>Si no se indica, se usa la duración de la acción/actividad (o 30 min).</summary>
    [Range(5, 480)]
    public int? DuracionMinutos { get; set; }

    [StringLength(1000)]
    public string? Notas { get; set; }
}

public class CambiarEstatusCitaRequest
{
    [EnumDataType(typeof(EstatusCita))]
    public EstatusCita Estatus { get; set; }
}

public class CitaService(IAppDbContext db)
{
    private static readonly EstatusCita[] EstatusQueLiberanHorario = [EstatusCita.Cancelada, EstatusCita.NoAsistio];

    public async Task<List<CitaDto>> ListarAsync(
        DateOnly? desde, DateOnly? hasta, int? empleadoId, int? prospectoId, CancellationToken ct)
    {
        var query = Consulta();

        if (desde is { } d)
            query = query.Where(c => c.FechaHoraInicio >= d.ToDateTime(TimeOnly.MinValue));
        if (hasta is { } h)
            query = query.Where(c => c.FechaHoraInicio < h.AddDays(1).ToDateTime(TimeOnly.MinValue));
        if (empleadoId is not null)
            query = query.Where(c => c.EmpleadoId == empleadoId);
        if (prospectoId is not null)
            query = query.Where(c => c.ProspectoId == prospectoId);

        var citas = await query.OrderBy(c => c.FechaHoraInicio).ToListAsync(ct);
        return citas.Select(CitaDto.Desde).ToList();
    }

    public async Task<CitaDto> ObtenerAsync(int id, CancellationToken ct) =>
        CitaDto.Desde(await Consulta().FirstOrDefaultAsync(c => c.Id == id, ct)
                      ?? throw new NoEncontradoException("Cita", id));

    public async Task<CitaDto> CrearAsync(GuardarCitaRequest req, CancellationToken ct)
    {
        var cita = new Cita();
        await AplicarAsync(cita, req, ct);
        db.Citas.Add(cita);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(cita.Id, ct);
    }

    public async Task<CitaDto> ActualizarAsync(int id, GuardarCitaRequest req, CancellationToken ct)
    {
        var cita = await BuscarAsync(id, ct);
        await AplicarAsync(cita, req, ct);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<CitaDto> CambiarEstatusAsync(int id, EstatusCita estatus, CancellationToken ct)
    {
        var cita = await BuscarAsync(id, ct);

        // Reactivar una cita cancelada vuelve a ocupar el horario: hay que validarlo.
        if (EstatusQueLiberanHorario.Contains(cita.Estatus) && !EstatusQueLiberanHorario.Contains(estatus))
            await ValidarHorarioLibreAsync(cita.EmpleadoId, cita.FechaHoraInicio, cita.DuracionMinutos, cita.Id, ct);

        cita.Estatus = estatus;
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task EliminarAsync(int id, CancellationToken ct)
    {
        var cita = await BuscarAsync(id, ct);
        db.Citas.Remove(cita);
        await db.SaveChangesAsync(ct);
    }

    private IQueryable<Cita> Consulta() =>
        db.Citas.AsNoTracking()
            .Include(c => c.Prospecto)
            .Include(c => c.Empleado)
            .Include(c => c.AccionActividad);

    private async Task<Cita> BuscarAsync(int id, CancellationToken ct) =>
        await db.Citas.FirstOrDefaultAsync(c => c.Id == id, ct)
        ?? throw new NoEncontradoException("Cita", id);

    private async Task AplicarAsync(Cita cita, GuardarCitaRequest req, CancellationToken ct)
    {
        if (!await db.Prospectos.AnyAsync(p => p.Id == req.ProspectoId && p.Activo, ct))
            throw new NoEncontradoException("Prospecto", req.ProspectoId);

        if (!await db.Empleados.AnyAsync(e => e.Id == req.EmpleadoId && e.Activo, ct))
            throw new NoEncontradoException("Empleado", req.EmpleadoId);

        var duracion = req.DuracionMinutos ?? 30;
        if (req.AccionActividadId is { } accionId)
        {
            var accion = await db.AccionesActividades.AsNoTracking().FirstOrDefaultAsync(a => a.Id == accionId, ct)
                         ?? throw new NoEncontradoException("Acción/actividad", accionId);
            duracion = req.DuracionMinutos ?? accion.DuracionMinutos;
        }

        var ocupaHorario = !EstatusQueLiberanHorario.Contains(cita.Estatus);
        if (ocupaHorario)
            await ValidarHorarioLibreAsync(req.EmpleadoId, req.FechaHoraInicio, duracion, cita.Id, ct);

        cita.ProspectoId = req.ProspectoId;
        cita.EmpleadoId = req.EmpleadoId;
        cita.AccionActividadId = req.AccionActividadId;
        cita.FechaHoraInicio = req.FechaHoraInicio;
        cita.DuracionMinutos = duracion;
        cita.Notas = req.Notas?.Trim();
    }

    /// <summary>Un empleado no puede tener dos citas activas que se traslapen.</summary>
    private async Task ValidarHorarioLibreAsync(int empleadoId, DateTime inicio, int duracion, int citaIdExcluir, CancellationToken ct)
    {
        var fin = inicio.AddMinutes(duracion);

        var traslape = await db.Citas.AsNoTracking()
            .Where(c => c.EmpleadoId == empleadoId
                        && c.Id != citaIdExcluir
                        && !EstatusQueLiberanHorario.Contains(c.Estatus)
                        && c.FechaHoraInicio < fin
                        && c.FechaHoraInicio.AddMinutes(c.DuracionMinutos) > inicio)
            .Select(c => new { c.FechaHoraInicio, c.DuracionMinutos })
            .FirstOrDefaultAsync(ct);

        if (traslape is not null)
            throw new ReglaNegocioException(
                $"El empleado ya tiene una cita de {traslape.FechaHoraInicio:HH:mm} a " +
                $"{traslape.FechaHoraInicio.AddMinutes(traslape.DuracionMinutos):HH:mm}.");
    }
}
