using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

/// <summary>Existencia de un producto en un almacén, con su costo promedio.</summary>
public class Existencia : EntidadBase
{
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int AlmacenId { get; set; }
    public Almacen? Almacen { get; set; }

    public decimal Cantidad { get; set; }

    /// <summary>Costo promedio ponderado de las unidades en existencia.</summary>
    public decimal CostoPromedio { get; set; }
}

/// <summary>
/// Movimiento de inventario (kárdex). Cada entrada o salida queda registrada con la
/// existencia anterior y la nueva; nunca se modifica ni se borra.
/// </summary>
public class MovimientoInventario : EntidadBase
{
    public DateTime Fecha { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public int AlmacenId { get; set; }
    public Almacen? Almacen { get; set; }

    public TipoMovimientoInventario Tipo { get; set; }

    /// <summary>Positiva en entradas, negativa en salidas.</summary>
    public decimal Cantidad { get; set; }
    public decimal ExistenciaAnterior { get; set; }
    public decimal ExistenciaNueva { get; set; }
    public decimal CostoUnitario { get; set; }

    /// <summary>Documento que originó el movimiento (OC-00001, CAR-00003...).</summary>
    public string? Referencia { get; set; }
    public string? Notas { get; set; }
}

/// <summary>Orden de compra a un proveedor (antes "Órdenes de compra" y "Aplicar compra").</summary>
public class OrdenCompra : EntidadBase
{
    public const decimal TasaIva = 0.16m;

    public int Consecutivo { get; set; }
    public string Folio { get; set; } = string.Empty;

    public int ProveedorId { get; set; }
    public Proveedor? Proveedor { get; set; }

    /// <summary>Almacén donde se recibe la mercancía.</summary>
    public int AlmacenId { get; set; }
    public Almacen? Almacen { get; set; }

    public DateOnly Fecha { get; set; }
    public DateOnly? FechaEntregaEstimada { get; set; }

    public int? CondicionPagoId { get; set; }
    public CondicionPago? CondicionPago { get; set; }
    public int DiasCredito { get; set; }

    public string? Notas { get; set; }
    public EstatusOrdenCompra Estatus { get; set; } = EstatusOrdenCompra.Pedida;
    public string? MotivoCancelacion { get; set; }

    public decimal Subtotal { get; private set; }
    public decimal Iva { get; private set; }
    public decimal Total { get; private set; }

    public ICollection<OrdenCompraPartida> Partidas { get; set; } = new List<OrdenCompraPartida>();

    public bool TieneRecepciones => Partidas.Any(p => p.CantidadRecibida > 0);

    public void RecalcularTotales()
    {
        Subtotal = Math.Round(Partidas.Sum(p => p.Importe), 2);
        Iva = Math.Round(Subtotal * TasaIva, 2);
        Total = Subtotal + Iva;
    }

    /// <summary>Actualiza el estatus según lo recibido.</summary>
    public void ActualizarEstatusPorRecepcion() =>
        Estatus = Partidas.All(p => p.CantidadRecibida >= p.Cantidad) ? EstatusOrdenCompra.Recibida
            : TieneRecepciones ? EstatusOrdenCompra.RecibidaParcial
            : EstatusOrdenCompra.Pedida;
}

public class OrdenCompraPartida : EntidadBase
{
    public int OrdenCompraId { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public string Descripcion { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal CantidadRecibida { get; set; }
    public decimal CostoUnitario { get; set; }

    public decimal Pendiente => Math.Max(0, Cantidad - CantidadRecibida);
    public decimal Importe => Math.Round(Cantidad * CostoUnitario, 2);
}
