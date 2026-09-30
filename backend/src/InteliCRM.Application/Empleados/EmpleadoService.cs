using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Empleados;

public record EmpleadoDto(
    int Id, string Nombre, string Apellidos, string NombreCompleto,
    string? Telefono, string? Correo,
    int? PuestoId, string? Puesto,
    int? UnidadNegocioId, string? UnidadNegocio,
    string ColorAgenda, bool Activo)
{
    public static EmpleadoDto Desde(Empleado e) => new(
        e.Id, e.Nombre, e.Apellidos, e.NombreCompleto, e.Telefono, e.Correo,
        e.PuestoId, e.Puesto?.Nombre, e.UnidadNegocioId, e.UnidadNegocio?.Nombre,
        e.ColorAgenda, e.Activo);
}

public class GuardarEmpleadoRequest
{
    [Required, StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required, StringLength(150)]
    public string Apellidos { get; set; } = string.Empty;

    [Phone, StringLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress, StringLength(150)]
    public string? Correo { get; set; }

    public int? PuestoId { get; set; }
    public int? UnidadNegocioId { get; set; }

    [RegularExpression("^#[0-9a-fA-F]{6}$", ErrorMessage = "El color debe tener formato #RRGGBB.")]
    public string ColorAgenda { get; set; } = "#3b82f6";

    public bool Activo { get; set; } = true;
}

public class EmpleadoService(IAppDbContext db)
{
    public async Task<List<EmpleadoDto>> ListarAsync(bool incluirInactivos, CancellationToken ct)
    {
        var empleados = await Consulta()
            .Where(e => incluirInactivos || e.Activo)
            .OrderBy(e => e.Nombre).ThenBy(e => e.Apellidos)
            .ToListAsync(ct);

        return empleados.Select(EmpleadoDto.Desde).ToList();
    }

    public async Task<EmpleadoDto> ObtenerAsync(int id, CancellationToken ct) =>
        EmpleadoDto.Desde(await Consulta().FirstOrDefaultAsync(e => e.Id == id, ct)
                          ?? throw new NoEncontradoException("Empleado", id));

    public async Task<EmpleadoDto> CrearAsync(GuardarEmpleadoRequest req, CancellationToken ct)
    {
        await ValidarReferenciasAsync(req, ct);
        var empleado = new Empleado();
        Aplicar(empleado, req);
        db.Empleados.Add(empleado);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(empleado.Id, ct);
    }

    public async Task<EmpleadoDto> ActualizarAsync(int id, GuardarEmpleadoRequest req, CancellationToken ct)
    {
        var empleado = await db.Empleados.FirstOrDefaultAsync(e => e.Id == id, ct)
                       ?? throw new NoEncontradoException("Empleado", id);
        await ValidarReferenciasAsync(req, ct);
        Aplicar(empleado, req);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var empleado = await db.Empleados.FirstOrDefaultAsync(e => e.Id == id, ct)
                       ?? throw new NoEncontradoException("Empleado", id);
        empleado.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    private IQueryable<Empleado> Consulta() =>
        db.Empleados.AsNoTracking().Include(e => e.Puesto).Include(e => e.UnidadNegocio);

    private async Task ValidarReferenciasAsync(GuardarEmpleadoRequest req, CancellationToken ct)
    {
        if (req.PuestoId is { } puestoId && !await db.Puestos.AnyAsync(p => p.Id == puestoId, ct))
            throw new NoEncontradoException("Puesto", puestoId);
        if (req.UnidadNegocioId is { } unidadId && !await db.UnidadesNegocio.AnyAsync(u => u.Id == unidadId, ct))
            throw new NoEncontradoException("Unidad de negocio", unidadId);
    }

    private static void Aplicar(Empleado e, GuardarEmpleadoRequest req)
    {
        e.Nombre = req.Nombre.Trim();
        e.Apellidos = req.Apellidos.Trim();
        e.Telefono = req.Telefono?.Trim();
        e.Correo = req.Correo?.Trim();
        e.PuestoId = req.PuestoId;
        e.UnidadNegocioId = req.UnidadNegocioId;
        e.ColorAgenda = req.ColorAgenda;
        e.Activo = req.Activo;
    }
}
