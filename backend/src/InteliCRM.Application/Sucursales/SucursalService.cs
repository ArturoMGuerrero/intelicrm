using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Sucursales;

public record SucursalDto(
    int Id, string Nombre, string? Telefono, string? Direccion, string? CodigoPostal, bool Activo, int Almacenes);

public record AlmacenDto(int Id, string Nombre, string? Ubicacion, int SucursalId, string? Sucursal, bool Activo)
{
    public static AlmacenDto Desde(Almacen a) => new(a.Id, a.Nombre, a.Ubicacion, a.SucursalId, a.Sucursal?.Nombre, a.Activo);
}

public class GuardarSucursalRequest
{
    [Required, StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Phone, StringLength(20)]
    public string? Telefono { get; set; }

    [StringLength(500)]
    public string? Direccion { get; set; }

    [RegularExpression("^[0-9]{5}$", ErrorMessage = "El código postal debe tener 5 dígitos.")]
    public string? CodigoPostal { get; set; }

    public bool Activo { get; set; } = true;
}

public class GuardarAlmacenRequest
{
    [Required, StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Ubicacion { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Selecciona la sucursal.")]
    public int SucursalId { get; set; }

    public bool Activo { get; set; } = true;
}

/// <summary>Sucursales de la empresa y los almacenes de cada una.</summary>
public class SucursalService(IAppDbContext db)
{
    // ---------- Sucursales ----------

    public Task<List<SucursalDto>> ListarAsync(bool incluirInactivos, CancellationToken ct) =>
        ADto(db.Sucursales.AsNoTracking().Where(s => incluirInactivos || s.Activo).OrderBy(s => s.Nombre))
            .ToListAsync(ct);

    public async Task<SucursalDto> ObtenerAsync(int id, CancellationToken ct) =>
        await ADto(db.Sucursales.AsNoTracking().Where(s => s.Id == id)).FirstOrDefaultAsync(ct)
        ?? throw new NoEncontradoException("Sucursal", id);

    public async Task<SucursalDto> CrearAsync(GuardarSucursalRequest req, CancellationToken ct)
    {
        await ValidarNombreSucursalAsync(req.Nombre, null, ct);
        var sucursal = new Sucursal();
        Aplicar(sucursal, req);
        db.Sucursales.Add(sucursal);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(sucursal.Id, ct);
    }

    public async Task<SucursalDto> ActualizarAsync(int id, GuardarSucursalRequest req, CancellationToken ct)
    {
        var sucursal = await BuscarSucursalAsync(id, ct);
        await ValidarNombreSucursalAsync(req.Nombre, id, ct);
        if (!req.Activo) await ValidarSinAlmacenesActivosAsync(id, ct);
        Aplicar(sucursal, req);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    /// <summary>Baja lógica. No se permite si la sucursal tiene almacenes activos.</summary>
    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var sucursal = await BuscarSucursalAsync(id, ct);
        await ValidarSinAlmacenesActivosAsync(id, ct);
        sucursal.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    // ---------- Almacenes ----------

    public async Task<List<AlmacenDto>> ListarAlmacenesAsync(int? sucursalId, bool incluirInactivos, CancellationToken ct)
    {
        var almacenes = await db.Almacenes.AsNoTracking().Include(a => a.Sucursal)
            .Where(a => incluirInactivos || a.Activo)
            .Where(a => sucursalId == null || a.SucursalId == sucursalId)
            .OrderBy(a => a.Sucursal!.Nombre).ThenBy(a => a.Nombre)
            .ToListAsync(ct);
        return almacenes.Select(AlmacenDto.Desde).ToList();
    }

    public async Task<AlmacenDto> ObtenerAlmacenAsync(int id, CancellationToken ct) =>
        AlmacenDto.Desde(await db.Almacenes.AsNoTracking().Include(a => a.Sucursal).FirstOrDefaultAsync(a => a.Id == id, ct)
                         ?? throw new NoEncontradoException("Almacén", id));

    public async Task<AlmacenDto> CrearAlmacenAsync(GuardarAlmacenRequest req, CancellationToken ct)
    {
        await ValidarAlmacenAsync(req, null, ct);
        var almacen = new Almacen();
        Aplicar(almacen, req);
        db.Almacenes.Add(almacen);
        await db.SaveChangesAsync(ct);
        return await ObtenerAlmacenAsync(almacen.Id, ct);
    }

    public async Task<AlmacenDto> ActualizarAlmacenAsync(int id, GuardarAlmacenRequest req, CancellationToken ct)
    {
        var almacen = await BuscarAlmacenAsync(id, ct);
        await ValidarAlmacenAsync(req, id, ct);
        Aplicar(almacen, req);
        await db.SaveChangesAsync(ct);
        return await ObtenerAlmacenAsync(id, ct);
    }

    public async Task DesactivarAlmacenAsync(int id, CancellationToken ct)
    {
        var almacen = await BuscarAlmacenAsync(id, ct);
        almacen.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    // ---------- Apoyo ----------

    /// <summary>Proyección con el número de almacenes activos (filtrar antes de proyectar).</summary>
    private static IQueryable<SucursalDto> ADto(IQueryable<Sucursal> sucursales) =>
        sucursales.Select(s => new SucursalDto(
            s.Id, s.Nombre, s.Telefono, s.Direccion, s.CodigoPostal, s.Activo, s.Almacenes.Count(a => a.Activo)));

    private async Task<Sucursal> BuscarSucursalAsync(int id, CancellationToken ct) =>
        await db.Sucursales.FirstOrDefaultAsync(s => s.Id == id, ct)
        ?? throw new NoEncontradoException("Sucursal", id);

    private async Task<Almacen> BuscarAlmacenAsync(int id, CancellationToken ct) =>
        await db.Almacenes.FirstOrDefaultAsync(a => a.Id == id, ct)
        ?? throw new NoEncontradoException("Almacén", id);

    private async Task ValidarNombreSucursalAsync(string nombre, int? excluirId, CancellationToken ct)
    {
        var normalizado = nombre.Trim().ToLower();
        if (await db.Sucursales.AnyAsync(s => s.Nombre.ToLower() == normalizado && s.Id != excluirId, ct))
            throw new ReglaNegocioException($"Ya existe una sucursal con el nombre '{nombre.Trim()}'.");
    }

    private async Task ValidarSinAlmacenesActivosAsync(int sucursalId, CancellationToken ct)
    {
        if (await db.Almacenes.AnyAsync(a => a.SucursalId == sucursalId && a.Activo, ct))
            throw new ReglaNegocioException("La sucursal tiene almacenes activos; dalos de baja primero.");
    }

    private async Task ValidarAlmacenAsync(GuardarAlmacenRequest req, int? excluirId, CancellationToken ct)
    {
        var sucursal = await db.Sucursales.AsNoTracking().FirstOrDefaultAsync(s => s.Id == req.SucursalId, ct)
                       ?? throw new NoEncontradoException("Sucursal", req.SucursalId);
        if (!sucursal.Activo && req.Activo)
            throw new ReglaNegocioException($"La sucursal '{sucursal.Nombre}' está inactiva.");

        var normalizado = req.Nombre.Trim().ToLower();
        if (await db.Almacenes.AnyAsync(a => a.SucursalId == req.SucursalId && a.Nombre.ToLower() == normalizado && a.Id != excluirId, ct))
            throw new ReglaNegocioException($"La sucursal ya tiene un almacén llamado '{req.Nombre.Trim()}'.");
    }

    private static void Aplicar(Sucursal s, GuardarSucursalRequest req)
    {
        s.Nombre = req.Nombre.Trim();
        s.Telefono = req.Telefono?.Trim();
        s.Direccion = req.Direccion?.Trim();
        s.CodigoPostal = string.IsNullOrWhiteSpace(req.CodigoPostal) ? null : req.CodigoPostal.Trim();
        s.Activo = req.Activo;
    }

    private static void Aplicar(Almacen a, GuardarAlmacenRequest req)
    {
        a.Nombre = req.Nombre.Trim();
        a.Ubicacion = req.Ubicacion?.Trim();
        a.SucursalId = req.SucursalId;
        a.Activo = req.Activo;
    }
}
