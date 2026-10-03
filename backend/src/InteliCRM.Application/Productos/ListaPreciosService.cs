using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Productos;

public record ListaPreciosResumenDto(int Id, string Nombre, string? Descripcion, bool Activo, int Productos, int Clientes);

public record PrecioListaDto(int ProductoId, string Codigo, string Producto, decimal PrecioGeneral, decimal Precio);

public record ListaPreciosDto(int Id, string Nombre, string? Descripcion, bool Activo, List<PrecioListaDto> Precios);

public class GuardarPrecioListaRequest
{
    public int ProductoId { get; set; }

    [Range(0, 100_000_000)]
    public decimal Precio { get; set; }
}

public class GuardarListaPreciosRequest
{
    [Required, StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    public bool Activo { get; set; } = true;

    public List<GuardarPrecioListaRequest> Precios { get; set; } = [];
}

/// <summary>Listas de precios especiales que se asignan a clientes.</summary>
public class ListaPreciosService(IAppDbContext db)
{
    public async Task<List<ListaPreciosResumenDto>> ListarAsync(bool incluirInactivas, CancellationToken ct) =>
        await db.ListasPrecios.AsNoTracking()
            .Where(l => incluirInactivas || l.Activo)
            .OrderBy(l => l.Nombre)
            .Select(l => new ListaPreciosResumenDto(l.Id, l.Nombre, l.Descripcion, l.Activo, l.Precios.Count,
                db.Clientes.Count(c => c.ListaPreciosId == l.Id && c.Activo)))
            .ToListAsync(ct);

    public async Task<ListaPreciosDto> ObtenerAsync(int id, CancellationToken ct)
    {
        var lista = await db.ListasPrecios.AsNoTracking().Include(l => l.Precios).ThenInclude(p => p.Producto)
                        .FirstOrDefaultAsync(l => l.Id == id, ct)
                    ?? throw new NoEncontradoException("Lista de precios", id);
        return new ListaPreciosDto(lista.Id, lista.Nombre, lista.Descripcion, lista.Activo,
            lista.Precios.OrderBy(p => p.Producto!.Nombre)
                .Select(p => new PrecioListaDto(p.ProductoId, p.Producto!.Codigo, p.Producto.Nombre, p.Producto.Precio, p.Precio))
                .ToList());
    }

    public async Task<ListaPreciosDto> CrearAsync(GuardarListaPreciosRequest req, CancellationToken ct)
    {
        var lista = new ListaPrecios();
        await AplicarAsync(lista, req, null, ct);
        db.ListasPrecios.Add(lista);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(lista.Id, ct);
    }

    public async Task<ListaPreciosDto> ActualizarAsync(int id, GuardarListaPreciosRequest req, CancellationToken ct)
    {
        var lista = await db.ListasPrecios.Include(l => l.Precios).FirstOrDefaultAsync(l => l.Id == id, ct)
                    ?? throw new NoEncontradoException("Lista de precios", id);
        await AplicarAsync(lista, req, id, ct);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var lista = await db.ListasPrecios.FirstOrDefaultAsync(l => l.Id == id, ct)
                    ?? throw new NoEncontradoException("Lista de precios", id);
        lista.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Precio de cada producto para un cliente: el de su lista (si tiene una activa) o el general.
    /// Solo regresa los productos con precio especial; los demás usan su precio general.
    /// </summary>
    public async Task<Dictionary<int, decimal>> PreciosParaClienteAsync(int clienteId, CancellationToken ct)
    {
        var listaId = await db.Clientes.AsNoTracking().Where(c => c.Id == clienteId)
                          .Select(c => new { c.ListaPreciosId, Activa = c.ListaPrecios != null && c.ListaPrecios.Activo })
                          .FirstOrDefaultAsync(ct)
                      ?? throw new NoEncontradoException("Cliente", clienteId);
        if (listaId.ListaPreciosId is not { } id || !listaId.Activa) return [];

        var precios = await db.PreciosLista.AsNoTracking().Where(p => p.ListaPreciosId == id).ToListAsync(ct);
        return precios.ToDictionary(p => p.ProductoId, p => p.Precio);
    }

    private async Task AplicarAsync(ListaPrecios lista, GuardarListaPreciosRequest req, int? excluirId, CancellationToken ct)
    {
        var nombre = req.Nombre.Trim();
        if (await db.ListasPrecios.AnyAsync(l => l.Nombre.ToLower() == nombre.ToLower() && l.Id != excluirId, ct))
            throw new ReglaNegocioException($"Ya existe una lista llamada '{nombre}'.");

        var repetido = req.Precios.GroupBy(p => p.ProductoId).FirstOrDefault(g => g.Count() > 1);
        if (repetido is not null)
            throw new ReglaNegocioException("Un producto aparece más de una vez en la lista.");

        var ids = req.Precios.Select(p => p.ProductoId).ToList();
        var existentes = await db.Productos.AsNoTracking().Where(p => ids.Contains(p.Id)).Select(p => p.Id).ToListAsync(ct);
        var faltante = ids.Except(existentes).FirstOrDefault();
        if (faltante != 0) throw new NoEncontradoException("Producto", faltante);

        lista.Nombre = nombre;
        lista.Descripcion = req.Descripcion?.Trim();
        lista.Activo = req.Activo;
        lista.Precios.Clear();
        foreach (var p in req.Precios)
            lista.Precios.Add(new PrecioLista { ProductoId = p.ProductoId, Precio = Math.Round(p.Precio, 2) });
    }
}
