using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Inventario;

public record ExistenciaDto(
    int ProductoId, string Codigo, string Producto, int? AlmacenId, string? Almacen,
    decimal Cantidad, decimal? StockMinimo, decimal CostoPromedio, decimal Valor, bool BajoMinimo);

public record MovimientoDto(
    int Id, DateTime Fecha, int ProductoId, string Producto, int AlmacenId, string Almacen,
    TipoMovimientoInventario Tipo, decimal Cantidad, decimal ExistenciaAnterior, decimal ExistenciaNueva,
    decimal CostoUnitario, string? Referencia, string? Notas);

public class FiltroExistencias
{
    /// <summary>Sin almacén: totales por producto sumando todos los almacenes.</summary>
    public int? AlmacenId { get; set; }
    public string? Buscar { get; set; }
    public bool SoloBajoMinimo { get; set; }
}

public class FiltroKardex
{
    public int? ProductoId { get; set; }
    public int? AlmacenId { get; set; }
    public DateOnly? Desde { get; set; }
    public DateOnly? Hasta { get; set; }
}

public class AjusteInventarioRequest
{
    public int ProductoId { get; set; }
    public int AlmacenId { get; set; }

    /// <summary>Cantidad contada físicamente; se registra la diferencia contra el sistema.</summary>
    [Range(0, 100_000_000)]
    public decimal CantidadFisica { get; set; }

    /// <summary>Costo de las unidades que entran (si el ajuste es de entrada). Si no se indica, el promedio actual.</summary>
    [Range(0, 100_000_000)]
    public decimal? CostoUnitario { get; set; }

    [Required(ErrorMessage = "Indica el motivo del ajuste."), StringLength(300)]
    public string Motivo { get; set; } = string.Empty;
}

public class TraspasoRequest
{
    public int ProductoId { get; set; }
    public int AlmacenOrigenId { get; set; }
    public int AlmacenDestinoId { get; set; }

    [Range(0.0001, 100_000_000, ErrorMessage = "La cantidad debe ser mayor a cero.")]
    public decimal Cantidad { get; set; }

    [StringLength(300)]
    public string? Notas { get; set; }
}

/// <summary>
/// Existencias por almacén y kárdex (antes "Existencias", "Kárdex" y "Modificar existencias").
/// Los métodos de entrada y salida no guardan: el llamador hace SaveChanges junto con su documento.
/// </summary>
public class InventarioService(IAppDbContext db)
{
    public async Task<List<ExistenciaDto>> ExistenciasAsync(FiltroExistencias filtro, CancellationToken ct)
    {
        var productos = db.Productos.AsNoTracking().Where(p => p.Activo && p.Tipo == TipoProducto.Producto);
        if (!string.IsNullOrWhiteSpace(filtro.Buscar))
        {
            var texto = filtro.Buscar.Trim().ToLower();
            productos = productos.Where(p => p.Nombre.ToLower().Contains(texto) || p.Codigo.ToLower().Contains(texto));
        }
        var lista = await productos.OrderBy(p => p.Nombre).ToListAsync(ct);

        var existencias = await db.Existencias.AsNoTracking().Include(e => e.Almacen)
            .Where(e => filtro.AlmacenId == null || e.AlmacenId == filtro.AlmacenId)
            .ToListAsync(ct);
        var porProducto = existencias.ToLookup(e => e.ProductoId);

        string? nombreAlmacen = filtro.AlmacenId is { } almId
            ? (await db.Almacenes.AsNoTracking().FirstOrDefaultAsync(a => a.Id == almId, ct)
               ?? throw new NoEncontradoException("Almacén", almId)).Nombre
            : null;

        var resultado = lista.Select(p =>
        {
            var filas = porProducto[p.Id].ToList();
            var cantidad = filas.Sum(e => e.Cantidad);
            var valor = Math.Round(filas.Sum(e => e.Cantidad * e.CostoPromedio), 2);
            var costo = cantidad > 0 ? Math.Round(valor / cantidad, 4) : filas.FirstOrDefault()?.CostoPromedio ?? p.Costo;
            var bajo = p.StockMinimo is { } minimo && cantidad < minimo;
            return new ExistenciaDto(p.Id, p.Codigo, p.Nombre, filtro.AlmacenId, nombreAlmacen, cantidad, p.StockMinimo, costo, valor, bajo);
        });

        return (filtro.SoloBajoMinimo ? resultado.Where(e => e.BajoMinimo) : resultado).ToList();
    }

    public async Task<List<MovimientoDto>> KardexAsync(FiltroKardex filtro, CancellationToken ct)
    {
        var query = db.MovimientosInventario.AsNoTracking().Include(m => m.Producto).Include(m => m.Almacen).AsQueryable();
        if (filtro.ProductoId is { } prodId) query = query.Where(m => m.ProductoId == prodId);
        if (filtro.AlmacenId is { } almId) query = query.Where(m => m.AlmacenId == almId);
        if (filtro.Desde is { } desde) query = query.Where(m => m.Fecha >= desde.ToDateTime(TimeOnly.MinValue));
        if (filtro.Hasta is { } hasta) query = query.Where(m => m.Fecha < hasta.AddDays(1).ToDateTime(TimeOnly.MinValue));

        var movimientos = await query.OrderByDescending(m => m.Fecha).ThenByDescending(m => m.Id).Take(1000).ToListAsync(ct);
        return movimientos.Select(m => new MovimientoDto(
            m.Id, m.Fecha, m.ProductoId, m.Producto!.Nombre, m.AlmacenId, m.Almacen!.Nombre, m.Tipo, m.Cantidad,
            m.ExistenciaAnterior, m.ExistenciaNueva, m.CostoUnitario, m.Referencia, m.Notas)).ToList();
    }

    /// <summary>Ajuste por conteo físico: registra la diferencia como entrada o salida.</summary>
    public async Task<ExistenciaDto> AjustarAsync(AjusteInventarioRequest req, CancellationToken ct)
    {
        await ValidarProductoYAlmacenAsync(req.ProductoId, req.AlmacenId, ct);
        var existencia = await ObtenerExistenciaAsync(req.ProductoId, req.AlmacenId, ct);
        var diferencia = req.CantidadFisica - existencia.Cantidad;
        if (diferencia == 0)
            throw new ReglaNegocioException("La cantidad física es igual a la existencia del sistema; no hay nada que ajustar.");

        if (diferencia > 0)
            await RegistrarEntradaAsync(req.ProductoId, req.AlmacenId, diferencia,
                req.CostoUnitario ?? existencia.CostoPromedio, TipoMovimientoInventario.AjusteEntrada, null, req.Motivo.Trim(), ct);
        else
            await RegistrarSalidaAsync(req.ProductoId, req.AlmacenId, -diferencia,
                TipoMovimientoInventario.AjusteSalida, null, req.Motivo.Trim(), ct);

        await db.SaveChangesAsync(ct);
        return (await ExistenciasAsync(new FiltroExistencias { AlmacenId = req.AlmacenId }, ct)).First(e => e.ProductoId == req.ProductoId);
    }

    public async Task TraspasarAsync(TraspasoRequest req, CancellationToken ct)
    {
        if (req.AlmacenOrigenId == req.AlmacenDestinoId)
            throw new ReglaNegocioException("El almacén de origen y el de destino deben ser distintos.");
        await ValidarProductoYAlmacenAsync(req.ProductoId, req.AlmacenOrigenId, ct);
        await ValidarProductoYAlmacenAsync(req.ProductoId, req.AlmacenDestinoId, ct);

        var costo = await RegistrarSalidaAsync(req.ProductoId, req.AlmacenOrigenId, req.Cantidad,
            TipoMovimientoInventario.TraspasoSalida, null, req.Notas?.Trim(), ct);
        await RegistrarEntradaAsync(req.ProductoId, req.AlmacenDestinoId, req.Cantidad, costo,
            TipoMovimientoInventario.TraspasoEntrada, null, req.Notas?.Trim(), ct);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Entrada: suma la cantidad y recalcula el costo promedio ponderado. No guarda.</summary>
    public async Task RegistrarEntradaAsync(int productoId, int almacenId, decimal cantidad, decimal costoUnitario,
        TipoMovimientoInventario tipo, string? referencia, string? notas, CancellationToken ct)
    {
        var existencia = await ObtenerExistenciaAsync(productoId, almacenId, ct);
        var anterior = existencia.Cantidad;
        var nueva = anterior + cantidad;

        existencia.CostoPromedio = anterior > 0 && nueva > 0
            ? Math.Round((anterior * existencia.CostoPromedio + cantidad * costoUnitario) / nueva, 4)
            : costoUnitario;
        existencia.Cantidad = nueva;

        db.MovimientosInventario.Add(new MovimientoInventario
        {
            Fecha = DateTime.Now, ProductoId = productoId, AlmacenId = almacenId, Tipo = tipo,
            Cantidad = cantidad, ExistenciaAnterior = anterior, ExistenciaNueva = nueva,
            CostoUnitario = costoUnitario, Referencia = referencia, Notas = notas,
        });
    }

    /// <summary>Salida al costo promedio. No permite dejar existencia negativa. Regresa el costo usado. No guarda.</summary>
    public async Task<decimal> RegistrarSalidaAsync(int productoId, int almacenId, decimal cantidad,
        TipoMovimientoInventario tipo, string? referencia, string? notas, CancellationToken ct)
    {
        var existencia = await ObtenerExistenciaAsync(productoId, almacenId, ct);
        var anterior = existencia.Cantidad;
        if (anterior < cantidad)
        {
            var producto = await db.Productos.AsNoTracking().Where(p => p.Id == productoId).Select(p => p.Nombre).FirstAsync(ct);
            var almacen = await db.Almacenes.AsNoTracking().Where(a => a.Id == almacenId).Select(a => a.Nombre).FirstAsync(ct);
            throw new ReglaNegocioException(
                $"No hay existencia suficiente de '{producto}' en {almacen}: hay {anterior:0.##} y se requieren {cantidad:0.##}.");
        }

        existencia.Cantidad = anterior - cantidad;
        db.MovimientosInventario.Add(new MovimientoInventario
        {
            Fecha = DateTime.Now, ProductoId = productoId, AlmacenId = almacenId, Tipo = tipo,
            Cantidad = -cantidad, ExistenciaAnterior = anterior, ExistenciaNueva = existencia.Cantidad,
            CostoUnitario = existencia.CostoPromedio, Referencia = referencia, Notas = notas,
        });
        return existencia.CostoPromedio;
    }

    /// <summary>Regresa mercancía al almacén al costo promedio actual (p. ej. al cancelar un cargo). No guarda.</summary>
    public async Task ReintegrarAsync(int productoId, int almacenId, decimal cantidad,
        TipoMovimientoInventario tipo, string? referencia, string? notas, CancellationToken ct)
    {
        var existencia = await ObtenerExistenciaAsync(productoId, almacenId, ct);
        await RegistrarEntradaAsync(productoId, almacenId, cantidad, existencia.CostoPromedio, tipo, referencia, notas, ct);
    }

    /// <summary>
    /// Existencia rastreada del producto en el almacén; la crea en cero si no existe.
    /// Revisa primero las ya cargadas en memoria para que varios movimientos del mismo
    /// documento (antes de guardar) se acumulen sobre el mismo registro.
    /// </summary>
    private async Task<Existencia> ObtenerExistenciaAsync(int productoId, int almacenId, CancellationToken ct)
    {
        var local = db.Existencias.Local.FirstOrDefault(e => e.ProductoId == productoId && e.AlmacenId == almacenId);
        if (local is not null) return local;

        var existencia = await db.Existencias.FirstOrDefaultAsync(e => e.ProductoId == productoId && e.AlmacenId == almacenId, ct);
        if (existencia is null)
        {
            existencia = new Existencia { ProductoId = productoId, AlmacenId = almacenId };
            db.Existencias.Add(existencia);
        }
        return existencia;
    }

    private async Task ValidarProductoYAlmacenAsync(int productoId, int almacenId, CancellationToken ct)
    {
        var producto = await db.Productos.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productoId, ct)
                       ?? throw new NoEncontradoException("Producto", productoId);
        if (!producto.ManejaInventario)
            throw new ReglaNegocioException($"'{producto.Nombre}' es un servicio y no lleva inventario.");
        if (!await db.Almacenes.AnyAsync(a => a.Id == almacenId && a.Activo, ct))
            throw new NoEncontradoException("Almacén", almacenId);
    }
}
