using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Productos;

public record ProductoDto(
    int Id, string Codigo, string Nombre, string? Descripcion, TipoProducto Tipo, decimal Precio, bool Activo)
{
    public static ProductoDto Desde(Producto p) =>
        new(p.Id, p.Codigo, p.Nombre, p.Descripcion, p.Tipo, p.Precio, p.Activo);
}

public class GuardarProductoRequest
{
    [Required, StringLength(30)]
    public string Codigo { get; set; } = string.Empty;

    [Required, StringLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Descripcion { get; set; }

    [EnumDataType(typeof(TipoProducto))]
    public TipoProducto Tipo { get; set; }

    [Range(0, 100_000_000)]
    public decimal Precio { get; set; }

    public bool Activo { get; set; } = true;
}

public class ProductoService(IAppDbContext db)
{
    public async Task<List<ProductoDto>> ListarAsync(string? buscar, bool incluirInactivos, CancellationToken ct)
    {
        var query = db.Productos.AsNoTracking().Where(p => incluirInactivos || p.Activo);

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var texto = buscar.Trim().ToLower();
            query = query.Where(p => p.Nombre.ToLower().Contains(texto) || p.Codigo.ToLower().Contains(texto));
        }

        var productos = await query.OrderBy(p => p.Nombre).ToListAsync(ct);
        return productos.Select(ProductoDto.Desde).ToList();
    }

    public async Task<ProductoDto> ObtenerAsync(int id, CancellationToken ct) =>
        ProductoDto.Desde(await BuscarAsync(id, ct));

    public async Task<ProductoDto> CrearAsync(GuardarProductoRequest req, CancellationToken ct)
    {
        await ValidarCodigoUnicoAsync(req.Codigo, null, ct);
        var producto = new Producto();
        Aplicar(producto, req);
        db.Productos.Add(producto);
        await db.SaveChangesAsync(ct);
        return ProductoDto.Desde(producto);
    }

    public async Task<ProductoDto> ActualizarAsync(int id, GuardarProductoRequest req, CancellationToken ct)
    {
        var producto = await BuscarAsync(id, ct);
        await ValidarCodigoUnicoAsync(req.Codigo, id, ct);
        Aplicar(producto, req);
        await db.SaveChangesAsync(ct);
        return ProductoDto.Desde(producto);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var producto = await BuscarAsync(id, ct);
        producto.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    private async Task<Producto> BuscarAsync(int id, CancellationToken ct) =>
        await db.Productos.FirstOrDefaultAsync(p => p.Id == id, ct)
        ?? throw new NoEncontradoException("Producto", id);

    private async Task ValidarCodigoUnicoAsync(string codigo, int? excluirId, CancellationToken ct)
    {
        var normalizado = codigo.Trim().ToUpper();
        if (await db.Productos.AnyAsync(p => p.Codigo == normalizado && p.Id != excluirId, ct))
            throw new ReglaNegocioException($"Ya existe un producto con el código {normalizado}.");
    }

    private static void Aplicar(Producto p, GuardarProductoRequest req)
    {
        p.Codigo = req.Codigo.Trim().ToUpper();
        p.Nombre = req.Nombre.Trim();
        p.Descripcion = req.Descripcion?.Trim();
        p.Tipo = req.Tipo;
        p.Precio = req.Precio;
        p.Activo = req.Activo;
    }
}
