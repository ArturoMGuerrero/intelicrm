using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Empleados;

public record BloqueHorarioDto(DayOfWeek Dia, TimeOnly HoraInicio, TimeOnly HoraFin);

public class GuardarBloqueHorarioRequest
{
    [EnumDataType(typeof(DayOfWeek))]
    public DayOfWeek Dia { get; set; }

    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
}

public class GuardarHorarioRequest
{
    public List<GuardarBloqueHorarioRequest> Bloques { get; set; } = [];
}

/// <summary>
/// Horario laboral de los empleados. Si un empleado tiene horario, sus citas deben caer
/// dentro de él; si no tiene ninguno, se le puede agendar a cualquier hora.
/// </summary>
public class HorarioService(IAppDbContext db)
{
    public async Task<List<BloqueHorarioDto>> ObtenerAsync(int empleadoId, CancellationToken ct)
    {
        await ValidarEmpleadoAsync(empleadoId, ct);
        var bloques = await db.HorariosEmpleado.AsNoTracking().Where(h => h.EmpleadoId == empleadoId).ToListAsync(ct);
        return bloques.OrderBy(h => OrdenDia(h.Dia)).ThenBy(h => h.HoraInicio)
            .Select(h => new BloqueHorarioDto(h.Dia, h.HoraInicio, h.HoraFin)).ToList();
    }

    /// <summary>Reemplaza el horario completo del empleado.</summary>
    public async Task<List<BloqueHorarioDto>> GuardarAsync(int empleadoId, GuardarHorarioRequest req, CancellationToken ct)
    {
        await ValidarEmpleadoAsync(empleadoId, ct);

        foreach (var b in req.Bloques)
            if (b.HoraFin <= b.HoraInicio)
                throw new ReglaNegocioException($"El {NombreDia(b.Dia)}: la hora final debe ser posterior a la inicial.");

        foreach (var dia in req.Bloques.GroupBy(b => b.Dia))
        {
            var ordenados = dia.OrderBy(b => b.HoraInicio).ToList();
            for (var i = 1; i < ordenados.Count; i++)
                if (ordenados[i].HoraInicio < ordenados[i - 1].HoraFin)
                    throw new ReglaNegocioException($"El {NombreDia(dia.Key)} tiene bloques de horario que se traslapan.");
        }

        var actuales = await db.HorariosEmpleado.Where(h => h.EmpleadoId == empleadoId).ToListAsync(ct);
        db.HorariosEmpleado.RemoveRange(actuales);
        db.HorariosEmpleado.AddRange(req.Bloques.Select(b => new HorarioEmpleado
        {
            EmpleadoId = empleadoId, Dia = b.Dia, HoraInicio = b.HoraInicio, HoraFin = b.HoraFin,
        }));
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(empleadoId, ct);
    }

    /// <summary>Lanza error si el empleado tiene horario y la cita no cabe completa en uno de sus bloques.</summary>
    public async Task ValidarDentroDeHorarioAsync(int empleadoId, DateTime inicio, int duracionMinutos, CancellationToken ct)
    {
        var bloques = await db.HorariosEmpleado.AsNoTracking().Where(h => h.EmpleadoId == empleadoId).ToListAsync(ct);
        if (bloques.Count == 0) return;

        var fin = inicio.AddMinutes(duracionMinutos);
        var horaInicio = TimeOnly.FromDateTime(inicio);
        var horaFin = TimeOnly.FromDateTime(fin);
        var delDia = bloques.Where(b => b.Dia == inicio.DayOfWeek).ToList();

        var cabe = fin.Date == inicio.Date && delDia.Any(b => horaInicio >= b.HoraInicio && horaFin <= b.HoraFin);
        if (cabe) return;

        var horario = delDia.Count == 0
            ? $"no trabaja el {NombreDia(inicio.DayOfWeek)}"
            : "su horario del " + NombreDia(inicio.DayOfWeek) + " es " +
              string.Join(" y ", delDia.OrderBy(b => b.HoraInicio).Select(b => $"{b.HoraInicio:HH\\:mm}–{b.HoraFin:HH\\:mm}"));
        throw new ReglaNegocioException($"La cita queda fuera del horario del empleado: {horario}.");
    }

    private async Task ValidarEmpleadoAsync(int empleadoId, CancellationToken ct)
    {
        if (!await db.Empleados.AnyAsync(e => e.Id == empleadoId, ct))
            throw new NoEncontradoException("Empleado", empleadoId);
    }

    /// <summary>Lunes primero, domingo al final.</summary>
    private static int OrdenDia(DayOfWeek dia) => ((int)dia + 6) % 7;

    private static string NombreDia(DayOfWeek dia) => dia switch
    {
        DayOfWeek.Monday => "lunes",
        DayOfWeek.Tuesday => "martes",
        DayOfWeek.Wednesday => "miércoles",
        DayOfWeek.Thursday => "jueves",
        DayOfWeek.Friday => "viernes",
        DayOfWeek.Saturday => "sábado",
        _ => "domingo",
    };
}
