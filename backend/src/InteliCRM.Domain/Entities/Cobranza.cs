using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

/// <summary>
/// Documento con saldo: un cargo a cliente (cuenta por cobrar) o una cuenta por pagar a proveedor.
/// Guarda totales y saldo; el saldo baja con cada pago aplicado y sube si un pago se cancela.
/// </summary>
public abstract class DocumentoConSaldo : EntidadBase
{
    public const decimal TasaIva = 0.16m;

    /// <summary>Número consecutivo dentro de la cuenta; el folio se arma a partir de él.</summary>
    public int Consecutivo { get; set; }
    public string Folio { get; set; } = string.Empty;

    public DateOnly Fecha { get; set; }

    /// <summary>Días de crédito (0 = contado). Define la fecha de vencimiento.</summary>
    public int DiasCredito { get; set; }
    public DateOnly FechaVencimiento { get; set; }

    public int? CondicionPagoId { get; set; }
    public CondicionPago? CondicionPago { get; set; }

    public string? Notas { get; set; }

    public EstatusDocumento Estatus { get; set; } = EstatusDocumento.Vigente;
    public string? MotivoCancelacion { get; set; }

    public decimal Subtotal { get; protected set; }
    public decimal Iva { get; protected set; }
    public decimal Total { get; protected set; }
    public decimal Saldo { get; protected set; }

    protected abstract IEnumerable<PagoBase> TodosLosPagos { get; }

    public decimal Pagado => Total - Saldo;

    public void FijarPlazo(DateOnly fecha, int diasCredito)
    {
        Fecha = fecha;
        DiasCredito = diasCredito;
        FechaVencimiento = fecha.AddDays(diasCredito);
    }

    public void FijarTotales(decimal subtotal, decimal iva)
    {
        Subtotal = Math.Round(subtotal, 2);
        Iva = Math.Round(iva, 2);
        Total = Subtotal + Iva;
        RecalcularSaldo();
    }

    public void RecalcularSaldo() =>
        Saldo = Total - TodosLosPagos.Where(p => !p.Cancelado).Sum(p => p.Monto);

    public EstadoSaldo Estado(DateOnly hoy) =>
        Estatus == EstatusDocumento.Cancelado ? EstadoSaldo.Cancelado
        : Saldo <= 0 ? EstadoSaldo.Liquidado
        : hoy > FechaVencimiento ? EstadoSaldo.Vencido
        : EstadoSaldo.Pendiente;

    public int DiasVencido(DateOnly hoy) =>
        Estado(hoy) == EstadoSaldo.Vencido ? hoy.DayNumber - FechaVencimiento.DayNumber : 0;
}

/// <summary>Pago (abono) aplicado a un documento. No se borra: se cancela para conservar el historial.</summary>
public abstract class PagoBase : EntidadBase
{
    public DateOnly Fecha { get; set; }
    public decimal Monto { get; set; }

    public int? InstrumentoPagoId { get; set; }
    public InstrumentoPago? InstrumentoPago { get; set; }

    /// <summary>Número de transferencia, cheque, autorización...</summary>
    public string? Referencia { get; set; }
    public string? Notas { get; set; }

    public bool Cancelado { get; set; }
    public DateTime? FechaCancelacion { get; set; }
}

/// <summary>
/// Cargo a un cliente o prospecto (antes "Cargos a prospectos" / "Remisión").
/// Genera la cuenta por cobrar: su saldo es lo que falta cobrar.
/// </summary>
public class Cargo : DocumentoConSaldo
{
    /// <summary>Se carga a un prospecto o a un cliente (al menos uno).</summary>
    public int? ProspectoId { get; set; }
    public Prospecto? Prospecto { get; set; }

    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public int? EmpleadoId { get; set; }
    public Empleado? Empleado { get; set; }

    /// <summary>Cotización de la que se generó (opcional).</summary>
    public int? CotizacionId { get; set; }
    public Cotizacion? Cotizacion { get; set; }

    public ICollection<CargoPartida> Partidas { get; set; } = new List<CargoPartida>();
    public ICollection<PagoCargo> Pagos { get; set; } = new List<PagoCargo>();

    protected override IEnumerable<PagoBase> TodosLosPagos => Pagos;

    public void RecalcularTotales()
    {
        var subtotal = Math.Round(Partidas.Sum(p => p.Importe), 2);
        FijarTotales(subtotal, Math.Round(subtotal * TasaIva, 2));
    }
}

public class CargoPartida : EntidadBase
{
    public int CargoId { get; set; }

    public int? ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public string Descripcion { get; set; } = string.Empty;
    public decimal Cantidad { get; set; } = 1;
    public decimal PrecioUnitario { get; set; }

    /// <summary>Porcentaje de descuento (0 a 100).</summary>
    public decimal DescuentoPorcentaje { get; set; }

    public decimal Importe => Math.Round(Cantidad * PrecioUnitario * (1 - DescuentoPorcentaje / 100m), 2);
}

public class PagoCargo : PagoBase
{
    public int CargoId { get; set; }
}

/// <summary>Documento por pagar a un proveedor (factura recibida).</summary>
public class CuentaPorPagar : DocumentoConSaldo
{
    public int ProveedorId { get; set; }
    public Proveedor? Proveedor { get; set; }

    /// <summary>Folio de la factura o documento del proveedor.</summary>
    public string? FolioProveedor { get; set; }
    public string Concepto { get; set; } = string.Empty;

    public ICollection<PagoProveedor> Pagos { get; set; } = new List<PagoProveedor>();

    protected override IEnumerable<PagoBase> TodosLosPagos => Pagos;
}

public class PagoProveedor : PagoBase
{
    public int CuentaPorPagarId { get; set; }
}
