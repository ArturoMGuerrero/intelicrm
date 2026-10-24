using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Productos;

public record ProductoProveedorDto(int ProveedorId, string Proveedor, string? CodigoProveedor, decimal? Costo);

public record ProductoDto(
    int Id, string Codigo, string Nombre, string? Descripcion, TipoProducto Tipo,
    int? CategoriaId, string? Categoria, decimal? MargenCategoria,
    string? CodigoBarras, string? CodigoAlterno, string? Presentacion, string? UnidadMedida, string? Ubicacion,
    decimal Precio, decimal? PrecioMayoreo, decimal? CantidadMayoreo,
    decimal Costo, decimal? StockMinimo, int? ProveedorId, string? Proveedor,
    List<ProductoProveedorDto> OtrosProveedores, bool TieneImagen, bool Activo);

public class GuardarProductoProveedorRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Selecciona un proveedor.")]
    public int ProveedorId { get; set; }

    [StringLength(50)]
    public string? CodigoProveedor { get; set; }

    [Range(0, 100_000_000)]
    public decimal? Costo { get; set; }
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

    public int? CategoriaId { get; set; }

    [RegularExpression("^[0-9A-Za-z-]{4,50}$", ErrorMessage = "El código de barras solo admite letras, números y guiones (4 a 50).")]
    public string? CodigoBarras { get; set; }

    [StringLength(50)]
    public string? CodigoAlterno { get; set; }

    [StringLength(100)]
    public string? Presentacion { get; set; }

    [StringLength(30)]
    public string? UnidadMedida { get; set; }

    [StringLength(100)]
    public string? Ubicacion { get; set; }

    [Range(0, 100_000_000)]
    public decimal Precio { get; set; }

    [Range(0, 100_000_000)]
    public decimal? PrecioMayoreo { get; set; }

    [Range(0, 100_000_000)]
    public decimal? CantidadMayoreo { get; set; }

    [Range(0, 100_000_000)]
    public decimal Costo { get; set; }

    /// <summary>Solo aplica a productos (no a servicios).</summary>
    [Range(0, 100_000_000)]
    public decimal? StockMinimo { get; set; }

    public int? ProveedorId { get; set; }

    public List<GuardarProductoProveedorRequest> OtrosProveedores { get; set; } = [];

    public bool Activo { get; set; } = true;
}

public class GuardarImagenProductoRequest
{
    /// <summary>Data URL PNG o JPEG; null la quita.</summary>
    [StringLength(420_000, ErrorMessage = "La imagen pesa más de 300 KB.")]
    public string? Imagen { get; set; }
}

public record ImagenProductoDto(string? Imagen);

public class ProductoService(IAppDbContext db)
{
    // Proyección sin la imagen: los listados no deben cargarla. Se filtra antes de proyectar.
    private static IQueryable<ProductoDto> Proyectar(IQueryable<Producto> consulta) => consulta.Select(p => new ProductoDto(
        p.Id, p.Codigo, p.Nombre, p.Descripcion, p.Tipo,
        p.CategoriaId, p.Categoria != null ? p.Categoria.Nombre : null, p.Categoria != null ? p.Categoria.MargenPorcentaje : null,
        p.CodigoBarras, p.CodigoAlterno, p.Presentacion, p.UnidadMedida, p.Ubicacion,
        p.Precio, p.PrecioMayoreo, p.CantidadMayoreo,
        p.Costo, p.StockMinimo, p.ProveedorId, p.Proveedor != null ? p.Proveedor.RazonSocial : null,
        p.OtrosProveedores.Select(x => new ProductoProveedorDto(x.ProveedorId, x.Proveedor!.RazonSocial, x.CodigoProveedor, x.Costo)).ToList(),
        p.Imagen != null, p.Activo));

    public async Task<List<ProductoDto>> ListarAsync(string? buscar, bool incluirInactivos, CancellationToken ct)
    {
        var query = db.Productos.AsNoTracking().Where(p => incluirInactivos || p.Activo);

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var texto = buscar.Trim().ToLower();
            query = query.Where(p => p.Nombre.ToLower().Contains(texto) || p.Codigo.ToLower().Contains(texto)
                                     || (p.CodigoBarras != null && p.CodigoBarras.ToLower() == texto)
                                     || (p.CodigoAlterno != null && p.CodigoAlterno.ToLower().Contains(texto)));
        }

        return await Proyectar(query.OrderBy(p => p.Nombre)).ToListAsync(ct);
    }

    public async Task<ProductoDto> ObtenerAsync(int id, CancellationToken ct) =>
        await Proyectar(db.Productos.AsNoTracking().Where(p => p.Id == id)).FirstOrDefaultAsync(ct)
        ?? throw new NoEncontradoException("Producto", id);

    public async Task<ProductoDto> CrearAsync(GuardarProductoRequest req, CancellationToken ct)
    {
        await ValidarAsync(req, null, ct);
        var producto = new Producto();
        Aplicar(producto, req);
        db.Productos.Add(producto);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(producto.Id, ct);
    }

    public async Task<ProductoDto> ActualizarAsync(int id, GuardarProductoRequest req, CancellationToken ct)
    {
        var producto = await db.Productos.Include(p => p.OtrosProveedores).FirstOrDefaultAsync(p => p.Id == id, ct)
                       ?? throw new NoEncontradoException("Producto", id);
        await ValidarAsync(req, id, ct);
        Aplicar(producto, req);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(producto.Id, ct);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var producto = await BuscarAsync(id, ct);
        producto.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    public async Task<ImagenProductoDto> ObtenerImagenAsync(int id, CancellationToken ct)
    {
        var imagen = await db.Productos.AsNoTracking().Where(p => p.Id == id).Select(p => new { p.Imagen }).FirstOrDefaultAsync(ct)
                     ?? throw new NoEncontradoException("Producto", id);
        return new ImagenProductoDto(imagen.Imagen);
    }

    public async Task<ImagenProductoDto> GuardarImagenAsync(int id, GuardarImagenProductoRequest req, CancellationToken ct)
    {
        if (req.Imagen is { Length: > 0 } imagen &&
            !(imagen.StartsWith("data:image/png;base64,") || imagen.StartsWith("data:image/jpeg;base64,")))
            throw new ReglaNegocioException("La imagen debe ser PNG o JPEG.");
        var producto = await BuscarAsync(id, ct);
        producto.Imagen = string.IsNullOrWhiteSpace(req.Imagen) ? null : req.Imagen;
        await db.SaveChangesAsync(ct);
        return new ImagenProductoDto(producto.Imagen);
    }

    private async Task<Producto> BuscarAsync(int id, CancellationToken ct) =>
        await db.Productos.FirstOrDefaultAsync(p => p.Id == id, ct)
        ?? throw new NoEncontradoException("Producto", id);

    private async Task ValidarAsync(GuardarProductoRequest req, int? excluirId, CancellationToken ct)
    {
        if (req.ProveedorId is { } provId && !await db.Proveedores.AnyAsync(p => p.Id == provId, ct))
            throw new NoEncontradoException("Proveedor", provId);
        if (req.CategoriaId is { } catId && !await db.CategoriasProducto.AnyAsync(c => c.Id == catId, ct))
            throw new NoEncontradoException("Categoría", catId);

        var otros = req.OtrosProveedores.Select(x => x.ProveedorId).ToList();
        if (otros.Distinct().Count() != otros.Count)
            throw new ReglaNegocioException("Un proveedor aparece dos veces en la lista de proveedores.");
        if (req.ProveedorId is { } principal && otros.Contains(principal))
            throw new ReglaNegocioException("El proveedor principal no debe repetirse en «otros proveedores».");
        if (otros.Count > 0 && await db.Proveedores.CountAsync(p => otros.Contains(p.Id), ct) != otros.Count)
            throw new ReglaNegocioException("Uno de los proveedores no existe.");

        if ((req.PrecioMayoreo is null) != (req.CantidadMayoreo is null))
            throw new ReglaNegocioException("Para el precio de mayoreo indica el precio y desde cuántas unidades aplica.");
        if (req.CantidadMayoreo is <= 1)
            throw new ReglaNegocioException("El mayoreo debe aplicar desde 2 unidades o más.");
        if (req.PrecioMayoreo is { } mayoreo && mayoreo >= req.Precio)
            throw new ReglaNegocioException("El precio de mayoreo debe ser menor que el precio normal.");

        var normalizado = req.Codigo.Trim().ToUpper();
        if (await db.Productos.AnyAsync(p => p.Codigo == normalizado && p.Id != excluirId, ct))
            throw new ReglaNegocioException($"Ya existe un producto con el código {normalizado}.");
        if (!string.IsNullOrWhiteSpace(req.CodigoBarras))
        {
            var barras = req.CodigoBarras.Trim();
            if (await db.Productos.AnyAsync(p => p.CodigoBarras == barras && p.Id != excluirId, ct))
                throw new ReglaNegocioException($"Ya existe un producto con el código de barras {barras}.");
        }
    }

    private static string? Limpio(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static void Aplicar(Producto p, GuardarProductoRequest req)
    {
        p.Codigo = req.Codigo.Trim().ToUpper();
        p.Nombre = req.Nombre.Trim();
        p.Descripcion = Limpio(req.Descripcion);
        p.Tipo = req.Tipo;
        p.CategoriaId = req.CategoriaId;
        p.CodigoBarras = Limpio(req.CodigoBarras);
        p.CodigoAlterno = Limpio(req.CodigoAlterno);
        p.Presentacion = Limpio(req.Presentacion);
        p.UnidadMedida = Limpio(req.UnidadMedida);
        p.Ubicacion = Limpio(req.Ubicacion);
        p.Precio = req.Precio;
        p.PrecioMayoreo = req.PrecioMayoreo;
        p.CantidadMayoreo = req.CantidadMayoreo;
        p.Costo = req.Costo;
        // Los servicios no llevan inventario.
        p.StockMinimo = req.Tipo == TipoProducto.Producto ? req.StockMinimo : null;
        p.ProveedorId = req.ProveedorId;
        p.Activo = req.Activo;

        p.OtrosProveedores.Clear();
        foreach (var x in req.OtrosProveedores)
            p.OtrosProveedores.Add(new ProductoProveedor { ProveedorId = x.ProveedorId, CodigoProveedor = Limpio(x.CodigoProveedor), Costo = x.Costo });
    }
}
