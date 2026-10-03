using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Common;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Catalogos;

public record CatalogoDto(int Id, string Nombre, string? Descripcion, bool Activo, int? DuracionMinutos, int? DiasCredito);

public class GuardarCatalogoRequest
{
    [Required, StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    public bool Activo { get; set; } = true;

    /// <summary>Solo aplica a Acciones y actividades.</summary>
    [Range(5, 480)]
    public int? DuracionMinutos { get; set; }

    /// <summary>Solo aplica a Condiciones de pago.</summary>
    [Range(0, 365)]
    public int? DiasCredito { get; set; }
}

/// <summary>
/// Servicio genérico para catálogos simples: Puestos, Unidades de negocio, Acciones/actividades,
/// Tipos de contacto, Descripciones de servicio, Instrumentos y Condiciones de pago.
/// </summary>
public class CatalogoService<T>(IAppDbContext db) where T : CatalogoBase, new()
{
    private readonly string _nombreEntidad = typeof(T).Name;

    public async Task<List<CatalogoDto>> ListarAsync(bool incluirInactivos, CancellationToken ct)
    {
        var items = await db.Set<T>().AsNoTracking()
            .Where(x => incluirInactivos || x.Activo)
            .OrderBy(x => x.Nombre)
            .ToListAsync(ct);

        return items.Select(ADto).ToList();
    }

    public async Task<CatalogoDto> ObtenerAsync(int id, CancellationToken ct) => ADto(await BuscarAsync(id, ct));

    public async Task<CatalogoDto> CrearAsync(GuardarCatalogoRequest req, CancellationToken ct)
    {
        var item = new T();
        await ValidarNombreUnicoAsync(req.Nombre, null, ct);
        Aplicar(item, req);
        db.Set<T>().Add(item);
        await db.SaveChangesAsync(ct);
        return ADto(item);
    }

    public async Task<CatalogoDto> ActualizarAsync(int id, GuardarCatalogoRequest req, CancellationToken ct)
    {
        var item = await BuscarAsync(id, ct);
        await ValidarNombreUnicoAsync(req.Nombre, id, ct);
        Aplicar(item, req);
        await db.SaveChangesAsync(ct);
        return ADto(item);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var item = await BuscarAsync(id, ct);
        item.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    private async Task<T> BuscarAsync(int id, CancellationToken ct) =>
        await db.Set<T>().FirstOrDefaultAsync(x => x.Id == id, ct)
        ?? throw new NoEncontradoException(_nombreEntidad, id);

    private async Task ValidarNombreUnicoAsync(string nombre, int? excluirId, CancellationToken ct)
    {
        var normalizado = nombre.Trim().ToLower();
        var existe = await db.Set<T>().AnyAsync(x => x.Nombre.ToLower() == normalizado && x.Id != excluirId, ct);
        if (existe)
            throw new ReglaNegocioException($"Ya existe un registro con el nombre '{nombre.Trim()}'.");
    }

    private static void Aplicar(T item, GuardarCatalogoRequest req)
    {
        item.Nombre = req.Nombre.Trim();
        item.Descripcion = req.Descripcion?.Trim();
        item.Activo = req.Activo;
        if (item is AccionActividad accion && req.DuracionMinutos is { } minutos)
            accion.DuracionMinutos = minutos;
        if (item is CondicionPago condicion && req.DiasCredito is { } dias)
            condicion.DiasCredito = dias;
    }

    private static CatalogoDto ADto(T x) =>
        new(x.Id, x.Nombre, x.Descripcion, x.Activo, (x as AccionActividad)?.DuracionMinutos, (x as CondicionPago)?.DiasCredito);
}
