using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Cobranza;
using InteliCRM.Application.Common;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Application.Inventario;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Compras;

public record OrdenCompraResumenDto(
    int Id, string Folio, DateOnly Fecha, DateOnly? FechaEntregaEstimada, int ProveedorId, string Proveedor,
    string Almacen, EstatusOrdenCompra Estatus, decimal Total, decimal PorcentajeRecibido);

public record PartidaCompraDto(
    int Id, int ProductoId, string Codigo, string Descripcion, decimal Cantidad, decimal CantidadRecibida,
    decimal Pendiente, decimal CostoUnitario, decimal Importe);

public record CuentaGeneradaDto(int Id, string Folio, string? FolioProveedor, DateOnly Fecha, decimal Total, decimal Saldo);

public record OrdenCompraDto(
    int Id, string Folio, DateOnly Fecha, DateOnly? FechaEntregaEstimada,
    int ProveedorId, string Proveedor, int AlmacenId, string Almacen,
    int? CondicionPagoId, string? CondicionPago, int DiasCredito, string? Notas,
    EstatusOrdenCompra Estatus, string? MotivoCancelacion,
    decimal Subtotal, decimal Iva, decimal Total,
    List<PartidaCompraDto> Partidas, List<CuentaGeneradaDto> CuentasPorPagar);

public class GuardarPartidaCompraRequest
{
    public int ProductoId { get; set; }

    [Range(0.0001, 100_000_000, ErrorMessage = "La cantidad debe ser mayor a cero.")]
    public decimal Cantidad { get; set; }

    /// <summary>Si no se indica, se usa el último costo del producto.</summary>
    [Range(0, 100_000_000)]
    public decimal? CostoUnitario { get; set; }
}

public class GuardarOrdenCompraRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Selecciona el proveedor.")]
    public int ProveedorId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Selecciona el almacén de recepción.")]
    public int AlmacenId { get; set; }

    public DateOnly? Fecha { get; set; }
    public DateOnly? FechaEntregaEstimada { get; set; }

    /// <summary>Si no se indica, se usa la del proveedor.</summary>
    public int? CondicionPagoId { get; set; }

    [Range(0, 365)]
    public int? DiasCredito { get; set; }

    [StringLength(2000)]
    public string? Notas { get; set; }

    [MinLength(1, ErrorMessage = "La orden debe tener al menos una partida.")]
    public List<GuardarPartidaCompraRequest> Partidas { get; set; } = [];
}

public class RecibirPartidaRequest
{
    public int PartidaId { get; set; }

    [Range(0, 100_000_000)]
    public decimal Cantidad { get; set; }
}

public class RecibirCompraRequest
{
    public DateOnly? Fecha { get; set; }

    /// <summary>Folio de la factura del proveedor que ampara la recepción.</summary>
    [StringLength(50)]
    public string? FolioProveedor { get; set; }

    public List<RecibirPartidaRequest> Partidas { get; set; } = [];
}

public record FaltanteDto(
    int ProductoId, string Codigo, string Producto, decimal Existencia, decimal PorRecibir, decimal StockMinimo,
    decimal Sugerido, decimal Costo, int? ProveedorId, string? Proveedor);

public class PedirFaltanteRequest
{
    public int ProductoId { get; set; }
    public int ProveedorId { get; set; }

    [Range(0.0001, 100_000_000)]
    public decimal Cantidad { get; set; }
}

public class PedirFaltantesRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Selecciona el almacén de recepción.")]
    public int AlmacenId { get; set; }

    [MinLength(1, ErrorMessage = "Selecciona al menos un producto.")]
    public List<PedirFaltanteRequest> Productos { get; set; } = [];
}

public class FiltroOrdenesCompra
{
    public string? Buscar { get; set; }
    public EstatusOrdenCompra? Estatus { get; set; }
    public int? ProveedorId { get; set; }
}

/// <summary>
/// Compras (antes "Pedido de faltantes", "Órdenes de compra" y "Aplicar compra").
/// Al recibir mercancía entra al almacén y se genera la cuenta por pagar de lo recibido.
/// </summary>
public class CompraService(IAppDbContext db, InventarioService inventario, CuentaPorPagarService cuentasPorPagar)
{
    public async Task<List<OrdenCompraResumenDto>> ListarAsync(FiltroOrdenesCompra filtro, CancellationToken ct)
    {
        var query = db.OrdenesCompra.AsNoTracking()
            .Include(o => o.Proveedor).Include(o => o.Almacen).Include(o => o.Partidas).AsQueryable();
        if (filtro.Estatus is { } estatus) query = query.Where(o => o.Estatus == estatus);
        if (filtro.ProveedorId is { } proveedorId) query = query.Where(o => o.ProveedorId == proveedorId);
        if (!string.IsNullOrWhiteSpace(filtro.Buscar))
        {
            var texto = filtro.Buscar.Trim().ToLower();
            query = query.Where(o => o.Folio.ToLower().Contains(texto) || o.Proveedor!.RazonSocial.ToLower().Contains(texto));
        }

        var ordenes = await query.OrderByDescending(o => o.Fecha).ThenByDescending(o => o.Id).ToListAsync(ct);
        return ordenes.Select(o =>
        {
            var pedido = o.Partidas.Sum(p => p.Cantidad);
            var recibido = o.Partidas.Sum(p => Math.Min(p.CantidadRecibida, p.Cantidad));
            return new OrdenCompraResumenDto(o.Id, o.Folio, o.Fecha, o.FechaEntregaEstimada, o.ProveedorId,
                o.Proveedor!.RazonSocial, o.Almacen!.Nombre, o.Estatus, o.Total,
                pedido > 0 ? Math.Round(recibido / pedido * 100, 0) : 0);
        }).ToList();
    }

    public async Task<OrdenCompraDto> ObtenerAsync(int id, CancellationToken ct)
    {
        var o = await db.OrdenesCompra.AsNoTracking()
                    .Include(x => x.Proveedor).Include(x => x.Almacen).Include(x => x.CondicionPago)
                    .Include(x => x.Partidas).ThenInclude(p => p.Producto)
                    .FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw new NoEncontradoException("Orden de compra", id);
        var cuentas = await db.CuentasPorPagar.AsNoTracking().Where(c => c.OrdenCompraId == id && c.Estatus == EstatusDocumento.Vigente)
            .OrderBy(c => c.Id).ToListAsync(ct);

        return new OrdenCompraDto(o.Id, o.Folio, o.Fecha, o.FechaEntregaEstimada, o.ProveedorId, o.Proveedor!.RazonSocial,
            o.AlmacenId, o.Almacen!.Nombre, o.CondicionPagoId, o.CondicionPago?.Nombre, o.DiasCredito, o.Notas,
            o.Estatus, o.MotivoCancelacion, o.Subtotal, o.Iva, o.Total,
            o.Partidas.OrderBy(p => p.Id).Select(p => new PartidaCompraDto(p.Id, p.ProductoId, p.Producto!.Codigo, p.Descripcion,
                p.Cantidad, p.CantidadRecibida, p.Pendiente, p.CostoUnitario, p.Importe)).ToList(),
            cuentas.Select(c => new CuentaGeneradaDto(c.Id, c.Folio, c.FolioProveedor, c.Fecha, c.Total, c.Saldo)).ToList());
    }

    public async Task<OrdenCompraDto> CrearAsync(GuardarOrdenCompraRequest req, CancellationToken ct)
    {
        var orden = new OrdenCompra();
        await AsignarFolioAsync([orden], ct);
        await AplicarAsync(orden, req, ct);
        db.OrdenesCompra.Add(orden);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(orden.Id, ct);
    }

    /// <summary>Solo se modifica mientras no tenga recepciones.</summary>
    public async Task<OrdenCompraDto> ActualizarAsync(int id, GuardarOrdenCompraRequest req, CancellationToken ct)
    {
        var orden = await BuscarAsync(id, ct);
        if (orden.Estatus != EstatusOrdenCompra.Pedida || orden.TieneRecepciones)
            throw new ReglaNegocioException("Solo se pueden modificar órdenes sin mercancía recibida.");
        await AplicarAsync(orden, req, ct);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<OrdenCompraDto> CancelarAsync(int id, string motivo, CancellationToken ct)
    {
        var orden = await BuscarAsync(id, ct);
        if (orden.Estatus == EstatusOrdenCompra.Cancelada)
            throw new ReglaNegocioException($"La orden {orden.Folio} ya estaba cancelada.");
        if (orden.TieneRecepciones)
            throw new ReglaNegocioException("La orden ya tiene mercancía recibida; no se puede cancelar.");
        orden.Estatus = EstatusOrdenCompra.Cancelada;
        orden.MotivoCancelacion = motivo.Trim();
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    /// <summary>
    /// Recibe mercancía (total o parcial): entra al almacén al costo de la orden, actualiza el
    /// último costo del producto y genera la cuenta por pagar por lo recibido.
    /// </summary>
    public async Task<OrdenCompraDto> RecibirAsync(int id, RecibirCompraRequest req, CancellationToken ct)
    {
        var orden = await BuscarAsync(id, ct);
        if (orden.Estatus is EstatusOrdenCompra.Cancelada or EstatusOrdenCompra.Recibida)
            throw new ReglaNegocioException($"La orden {orden.Folio} está {orden.Estatus.ToString().ToLower()}.");

        var fecha = req.Fecha ?? Saldos.Hoy;
        if (fecha < orden.Fecha) throw new ReglaNegocioException("La fecha de recepción no puede ser anterior a la orden.");
        if (fecha > Saldos.Hoy) throw new ReglaNegocioException("La fecha de recepción no puede ser futura.");

        var recepciones = req.Partidas.Where(p => p.Cantidad > 0).ToList();
        if (recepciones.Count == 0) throw new ReglaNegocioException("Indica la cantidad recibida de al menos una partida.");

        decimal subtotal = 0;
        foreach (var r in recepciones)
        {
            var partida = orden.Partidas.FirstOrDefault(p => p.Id == r.PartidaId)
                          ?? throw new NoEncontradoException("Partida de la orden", r.PartidaId);
            if (r.Cantidad > partida.Pendiente)
                throw new ReglaNegocioException($"De '{partida.Descripcion}' solo faltan por recibir {partida.Pendiente:0.##}.");

            await inventario.RegistrarEntradaAsync(partida.ProductoId, orden.AlmacenId, r.Cantidad, partida.CostoUnitario,
                TipoMovimientoInventario.EntradaCompra, orden.Folio, req.FolioProveedor?.Trim(), ct);
            partida.CantidadRecibida += r.Cantidad;
            subtotal += Math.Round(r.Cantidad * partida.CostoUnitario, 2);

            var producto = await db.Productos.FirstAsync(p => p.Id == partida.ProductoId, ct);
            producto.Costo = partida.CostoUnitario;
        }

        orden.ActualizarEstatusPorRecepcion();

        var cuenta = await cuentasPorPagar.NuevaDesdeCompraAsync(orden, fecha, req.FolioProveedor, subtotal, ct);
        db.CuentasPorPagar.Add(cuenta);

        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    /// <summary>
    /// Productos cuya existencia más lo pendiente por recibir queda debajo del stock mínimo.
    /// Se sugiere pedir lo necesario para llegar al mínimo.
    /// </summary>
    public async Task<List<FaltanteDto>> FaltantesAsync(CancellationToken ct)
    {
        var productos = await db.Productos.AsNoTracking().Include(p => p.Proveedor)
            .Where(p => p.Activo && p.Tipo == TipoProducto.Producto && p.StockMinimo != null)
            .ToListAsync(ct);
        var existencias = (await db.Existencias.AsNoTracking().ToListAsync(ct))
            .GroupBy(e => e.ProductoId).ToDictionary(g => g.Key, g => g.Sum(e => e.Cantidad));
        var porRecibir = (await db.OrdenesCompra.AsNoTracking().Include(o => o.Partidas)
                .Where(o => o.Estatus == EstatusOrdenCompra.Pedida || o.Estatus == EstatusOrdenCompra.RecibidaParcial)
                .ToListAsync(ct))
            .SelectMany(o => o.Partidas).GroupBy(p => p.ProductoId).ToDictionary(g => g.Key, g => g.Sum(p => p.Pendiente));

        return productos
            .Select(p =>
            {
                var existencia = existencias.GetValueOrDefault(p.Id);
                var pendiente = porRecibir.GetValueOrDefault(p.Id);
                var sugerido = Math.Ceiling(p.StockMinimo!.Value - existencia - pendiente);
                return new FaltanteDto(p.Id, p.Codigo, p.Nombre, existencia, pendiente, p.StockMinimo.Value,
                    sugerido, p.Costo, p.ProveedorId, p.Proveedor?.RazonSocial);
            })
            .Where(f => f.Sugerido > 0)
            .OrderBy(f => f.Proveedor ?? "~").ThenBy(f => f.Producto)
            .ToList();
    }

    /// <summary>Genera una orden de compra por proveedor con los faltantes seleccionados.</summary>
    public async Task<List<OrdenCompraResumenDto>> PedirFaltantesAsync(PedirFaltantesRequest req, CancellationToken ct)
    {
        var ordenes = req.Productos.GroupBy(p => p.ProveedorId).Select(g => (Proveedor: g.Key, Req: new GuardarOrdenCompraRequest
        {
            ProveedorId = g.Key,
            AlmacenId = req.AlmacenId,
            Notas = "Pedido de faltantes.",
            Partidas = g.Select(p => new GuardarPartidaCompraRequest { ProductoId = p.ProductoId, Cantidad = p.Cantidad }).ToList(),
        })).ToList();

        var nuevas = ordenes.Select(_ => new OrdenCompra()).ToList();
        await AsignarFolioAsync(nuevas, ct);
        for (var i = 0; i < nuevas.Count; i++)
        {
            await AplicarAsync(nuevas[i], ordenes[i].Req, ct);
            db.OrdenesCompra.Add(nuevas[i]);
        }
        await db.SaveChangesAsync(ct);

        var ids = nuevas.Select(o => o.Id).ToList();
        return (await ListarAsync(new FiltroOrdenesCompra(), ct)).Where(o => ids.Contains(o.Id)).ToList();
    }

    private async Task<OrdenCompra> BuscarAsync(int id, CancellationToken ct) =>
        await db.OrdenesCompra.Include(o => o.Partidas).FirstOrDefaultAsync(o => o.Id == id, ct)
        ?? throw new NoEncontradoException("Orden de compra", id);

    /// <summary>Consecutivos por cuenta; el índice único (CuentaId, Consecutivo) evita duplicados simultáneos.</summary>
    private async Task AsignarFolioAsync(IEnumerable<OrdenCompra> ordenes, CancellationToken ct)
    {
        var consecutivo = await db.OrdenesCompra.MaxAsync(o => (int?)o.Consecutivo, ct) ?? 0;
        foreach (var o in ordenes)
        {
            o.Consecutivo = ++consecutivo;
            o.Folio = $"OC-{consecutivo:D5}";
        }
    }

    private async Task AplicarAsync(OrdenCompra orden, GuardarOrdenCompraRequest req, CancellationToken ct)
    {
        var proveedor = await db.Proveedores.AsNoTracking().FirstOrDefaultAsync(p => p.Id == req.ProveedorId, ct)
                        ?? throw new NoEncontradoException("Proveedor", req.ProveedorId);
        if (!await db.Almacenes.AnyAsync(a => a.Id == req.AlmacenId && a.Activo, ct))
            throw new NoEncontradoException("Almacén", req.AlmacenId);

        var ids = req.Partidas.Select(p => p.ProductoId).Distinct().ToList();
        var productos = await db.Productos.AsNoTracking().Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
        foreach (var p in req.Partidas)
        {
            if (!productos.TryGetValue(p.ProductoId, out var producto)) throw new NoEncontradoException("Producto", p.ProductoId);
            if (!producto.ManejaInventario)
                throw new ReglaNegocioException($"'{producto.Nombre}' es un servicio; en compras solo van productos.");
        }

        var condicionId = req.CondicionPagoId ?? proveedor.CondicionPagoId;
        orden.ProveedorId = req.ProveedorId;
        orden.AlmacenId = req.AlmacenId;
        orden.Fecha = req.Fecha ?? Saldos.Hoy;
        orden.FechaEntregaEstimada = req.FechaEntregaEstimada;
        orden.CondicionPagoId = condicionId;
        orden.DiasCredito = await Saldos.DiasCreditoAsync(db, condicionId, req.DiasCredito, ct);
        orden.Notas = req.Notas?.Trim();

        orden.Partidas.Clear();
        foreach (var p in req.Partidas)
        {
            var producto = productos[p.ProductoId];
            orden.Partidas.Add(new OrdenCompraPartida
            {
                ProductoId = p.ProductoId, Descripcion = producto.Nombre, Cantidad = p.Cantidad,
                CostoUnitario = Math.Round(p.CostoUnitario ?? producto.Costo, 4),
            });
        }
        orden.RecalcularTotales();
    }
}
