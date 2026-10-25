using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

public class Cotizacion : EntidadBase
{
    /// <summary>Número consecutivo dentro de la cuenta; el folio se arma a partir de él.</summary>
    public int Consecutivo { get; set; }
    public string Folio { get; set; } = string.Empty;

    /// <summary>Se cotiza a un prospecto o a un cliente (al menos uno).</summary>
    public int? ProspectoId { get; set; }
    public Prospecto? Prospecto { get; set; }

    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public int? EmpleadoId { get; set; }
    public Empleado? Empleado { get; set; }

    public DateOnly Fecha { get; set; }
    public int VigenciaDias { get; set; } = 15;
    public EstatusCotizacion Estatus { get; set; } = EstatusCotizacion.Borrador;

    /// <summary>Moneda de los precios. En dólares se guarda el tipo de cambio para convertir al generar el cargo.</summary>
    public Moneda Moneda { get; set; } = Moneda.MXN;
    public decimal? TipoCambio { get; set; }

    /// <summary>"A la atención de": persona del cliente o prospecto a quien va dirigida (se guarda el texto).</summary>
    public string? Atencion { get; set; }
    public string? Notas { get; set; }

    public decimal Subtotal { get; private set; }
    public decimal Iva { get; private set; }
    public decimal Total { get; private set; }

    public ICollection<CotizacionPartida> Partidas { get; set; } = new List<CotizacionPartida>();

    public DateOnly FechaVencimiento => Fecha.AddDays(VigenciaDias);

    public void RecalcularTotales()
    {
        Subtotal = Math.Round(Partidas.Sum(p => p.Importe), 2);
        Iva = Common.Iva.Calcular(Partidas.Select(p => (p.Importe, p.TasaIva)));
        Total = Subtotal + Iva;
    }
}

public class CotizacionPartida : EntidadBase
{
    public int CotizacionId { get; set; }

    public int? ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public string Descripcion { get; set; } = string.Empty;
    public decimal Cantidad { get; set; } = 1;
    public decimal PrecioUnitario { get; set; }

    /// <summary>Porcentaje de descuento (0 a 100).</summary>
    public decimal DescuentoPorcentaje { get; set; }

    /// <summary>Tasa de IVA de la partida (0, 0.08 o 0.16).</summary>
    public decimal TasaIva { get; set; } = Iva.Predeterminada;

    public decimal Importe => Math.Round(Cantidad * PrecioUnitario * (1 - DescuentoPorcentaje / 100m), 2);
}
