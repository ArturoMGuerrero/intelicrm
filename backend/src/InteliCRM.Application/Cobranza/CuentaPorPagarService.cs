using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Cobranza;

public record CuentaPorPagarResumenDto(
    int Id, string Folio, string? FolioProveedor, DateOnly Fecha, DateOnly FechaVencimiento, int DiasCredito,
    int ProveedorId, string Proveedor, string Concepto,
    decimal Total, decimal Pagado, decimal Saldo, EstadoSaldo Estado, int DiasVencido)
{
    public static CuentaPorPagarResumenDto Desde(CuentaPorPagar c, DateOnly hoy) => new(
        c.Id, c.Folio, c.FolioProveedor, c.Fecha, c.FechaVencimiento, c.DiasCredito,
        c.ProveedorId, c.Proveedor?.RazonSocial ?? "", c.Concepto,
        c.Total, c.Pagado, c.Saldo, c.Estado(hoy), c.DiasVencido(hoy));
}

public record CuentaPorPagarDto(
    int Id, string Folio, string? FolioProveedor, DateOnly Fecha, DateOnly FechaVencimiento, int DiasCredito,
    int? CondicionPagoId, string? CondicionPago,
    int ProveedorId, string Proveedor, string Concepto, string? Notas,
    EstatusDocumento Estatus, string? MotivoCancelacion,
    decimal Subtotal, decimal Iva, decimal Total, decimal Pagado, decimal Saldo,
    EstadoSaldo Estado, int DiasVencido, List<PagoDto> Pagos)
{
    public static CuentaPorPagarDto Desde(CuentaPorPagar c, DateOnly hoy) => new(
        c.Id, c.Folio, c.FolioProveedor, c.Fecha, c.FechaVencimiento, c.DiasCredito,
        c.CondicionPagoId, c.CondicionPago?.Nombre,
        c.ProveedorId, c.Proveedor?.RazonSocial ?? "", c.Concepto, c.Notas,
        c.Estatus, c.MotivoCancelacion,
        c.Subtotal, c.Iva, c.Total, c.Pagado, c.Saldo, c.Estado(hoy), c.DiasVencido(hoy),
        c.Pagos.OrderBy(p => p.Fecha).ThenBy(p => p.Id).Select(PagoDto.Desde).ToList());
}

public class GuardarCuentaPorPagarRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Selecciona el proveedor.")]
    public int ProveedorId { get; set; }

    [StringLength(50)]
    public string? FolioProveedor { get; set; }

    [Required, StringLength(300)]
    public string Concepto { get; set; } = string.Empty;

    /// <summary>Si no se indica, se usa la fecha de hoy.</summary>
    public DateOnly? Fecha { get; set; }

    /// <summary>Si no se indica, se usa la condición de pago del proveedor.</summary>
    public int? CondicionPagoId { get; set; }

    [Range(0, 365)]
    public int? DiasCredito { get; set; }

    [Range(0.01, 100_000_000, ErrorMessage = "El subtotal debe ser mayor a cero.")]
    public decimal Subtotal { get; set; }

    /// <summary>Si es verdadero se agrega IVA del 16 %.</summary>
    public bool ConIva { get; set; } = true;

    [StringLength(2000)]
    public string? Notas { get; set; }
}

public class FiltroCuentasPorPagar
{
    public string? Buscar { get; set; }
    public FiltroEstadoSaldo Estado { get; set; } = FiltroEstadoSaldo.Todos;
    public int? ProveedorId { get; set; }
}

/// <summary>
/// Cuentas por pagar a proveedores. Por ahora se capturan a mano; cuando exista el módulo de
/// compras se generarán al aplicar una orden de compra.
/// </summary>
public class CuentaPorPagarService(IAppDbContext db)
{
    public async Task<List<CuentaPorPagarResumenDto>> ListarAsync(FiltroCuentasPorPagar filtro, CancellationToken ct)
    {
        var query = db.CuentasPorPagar.AsNoTracking().Include(c => c.Proveedor).AsQueryable();
        if (filtro.ProveedorId is { } proveedorId) query = query.Where(c => c.ProveedorId == proveedorId);

        if (!string.IsNullOrWhiteSpace(filtro.Buscar))
        {
            var texto = filtro.Buscar.Trim().ToLower();
            query = query.Where(c =>
                c.Folio.ToLower().Contains(texto) ||
                c.Concepto.ToLower().Contains(texto) ||
                (c.FolioProveedor != null && c.FolioProveedor.ToLower().Contains(texto)) ||
                c.Proveedor!.RazonSocial.ToLower().Contains(texto));
        }

        var hoy = Saldos.Hoy;
        var cuentas = await query.OrderBy(c => c.FechaVencimiento).ThenBy(c => c.Id).ToListAsync(ct);
        return cuentas.Where(c => Saldos.Cumple(c, filtro.Estado, hoy)).Select(c => CuentaPorPagarResumenDto.Desde(c, hoy)).ToList();
    }

    public async Task<CuentaPorPagarDto> ObtenerAsync(int id, CancellationToken ct) =>
        CuentaPorPagarDto.Desde(await Consulta().AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)
                                ?? throw new NoEncontradoException("Cuenta por pagar", id), Saldos.Hoy);

    public async Task<ResumenSaldosDto> ResumenAsync(CancellationToken ct)
    {
        var cuentas = await db.CuentasPorPagar.AsNoTracking().Where(c => c.Estatus == EstatusDocumento.Vigente).ToListAsync(ct);
        var inicioMes = new DateOnly(Saldos.Hoy.Year, Saldos.Hoy.Month, 1);
        var pagosMes = await db.PagosProveedor.AsNoTracking().Where(p => p.Fecha >= inicioMes && !p.Cancelado).ToListAsync(ct);
        return Saldos.Resumir(cuentas, pagosMes);
    }

    public async Task<CuentaPorPagarDto> CrearAsync(GuardarCuentaPorPagarRequest req, CancellationToken ct)
    {
        // Consecutivo por cuenta; el índice único (CuentaId, Consecutivo) evita duplicados simultáneos.
        var consecutivo = (await db.CuentasPorPagar.MaxAsync(c => (int?)c.Consecutivo, ct) ?? 0) + 1;
        var cuenta = new CuentaPorPagar { Consecutivo = consecutivo, Folio = $"CXP-{consecutivo:D5}" };
        await AplicarAsync(cuenta, req, null, ct);
        db.CuentasPorPagar.Add(cuenta);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(cuenta.Id, ct);
    }

    /// <summary>Solo se puede modificar mientras no tenga pagos aplicados.</summary>
    public async Task<CuentaPorPagarDto> ActualizarAsync(int id, GuardarCuentaPorPagarRequest req, CancellationToken ct)
    {
        var cuenta = await BuscarConPagosAsync(id, ct);
        if (cuenta.Estatus == EstatusDocumento.Cancelado)
            throw new ReglaNegocioException($"La cuenta {cuenta.Folio} está cancelada.");
        if (cuenta.Pagos.Any(p => !p.Cancelado))
            throw new ReglaNegocioException("No se puede modificar una cuenta con pagos aplicados.");

        await AplicarAsync(cuenta, req, id, ct);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<CuentaPorPagarDto> CancelarAsync(int id, string motivo, CancellationToken ct)
    {
        var cuenta = await BuscarConPagosAsync(id, ct);
        Saldos.CancelarDocumento(cuenta, cuenta.Pagos, motivo);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<CuentaPorPagarDto> RegistrarPagoAsync(int id, RegistrarPagoRequest req, CancellationToken ct)
    {
        var cuenta = await BuscarConPagosAsync(id, ct);
        var pago = await Saldos.NuevoPagoAsync<PagoProveedor>(db, cuenta, req, ct);
        cuenta.Pagos.Add(pago);
        cuenta.RecalcularSaldo();
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<CuentaPorPagarDto> CancelarPagoAsync(int id, int pagoId, CancellationToken ct)
    {
        var cuenta = await BuscarConPagosAsync(id, ct);
        Saldos.CancelarPago(cuenta, cuenta.Pagos.FirstOrDefault(p => p.Id == pagoId), pagoId);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    private IQueryable<CuentaPorPagar> Consulta() =>
        db.CuentasPorPagar.Include(c => c.Proveedor).Include(c => c.CondicionPago)
            .Include(c => c.Pagos).ThenInclude(p => p.InstrumentoPago);

    private async Task<CuentaPorPagar> BuscarConPagosAsync(int id, CancellationToken ct) =>
        await db.CuentasPorPagar.Include(c => c.Pagos).FirstOrDefaultAsync(c => c.Id == id, ct)
        ?? throw new NoEncontradoException("Cuenta por pagar", id);

    private async Task AplicarAsync(CuentaPorPagar cuenta, GuardarCuentaPorPagarRequest req, int? excluirId, CancellationToken ct)
    {
        var proveedor = await db.Proveedores.AsNoTracking().FirstOrDefaultAsync(p => p.Id == req.ProveedorId, ct)
                        ?? throw new NoEncontradoException("Proveedor", req.ProveedorId);

        // El mismo folio de factura no se puede registrar dos veces para un proveedor.
        var folioProveedor = string.IsNullOrWhiteSpace(req.FolioProveedor) ? null : req.FolioProveedor.Trim().ToUpper();
        if (folioProveedor is not null && await db.CuentasPorPagar.AnyAsync(c =>
                c.ProveedorId == req.ProveedorId && c.FolioProveedor == folioProveedor &&
                c.Estatus == EstatusDocumento.Vigente && c.Id != excluirId, ct))
            throw new ReglaNegocioException($"Ya existe una cuenta vigente con el folio {folioProveedor} de este proveedor.");

        var condicionId = req.CondicionPagoId ?? proveedor.CondicionPagoId;
        var dias = await Saldos.DiasCreditoAsync(db, condicionId, req.DiasCredito, ct);

        cuenta.ProveedorId = req.ProveedorId;
        cuenta.FolioProveedor = folioProveedor;
        cuenta.Concepto = req.Concepto.Trim();
        cuenta.CondicionPagoId = condicionId;
        cuenta.Notas = req.Notas?.Trim();
        cuenta.FijarPlazo(req.Fecha ?? Saldos.Hoy, dias);
        cuenta.FijarTotales(req.Subtotal, req.ConIva ? req.Subtotal * DocumentoConSaldo.TasaIva : 0);
    }
}
