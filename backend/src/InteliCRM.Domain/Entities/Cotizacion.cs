using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

public class Cotizacion : EntidadBase
{
    public const decimal TasaIva = 0.16m;

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
    public string? Notas { get; set; }

    public decimal Subtotal { get; private set; }
    public decimal Iva { get; private set; }
    public decimal Total { get; private set; }

    public ICollection<CotizacionPartida> Partidas { get; set; } = new List<CotizacionPartida>();

    public DateOnly FechaVencimiento => Fecha.AddDays(VigenciaDias);

    public void RecalcularTotales()
    {
        Subtotal = Math.Round(Partidas.Sum(p => p.Importe), 2);
        Iva = Math.Round(Subtotal * TasaIva, 2);
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

    public decimal Importe => Math.Round(Cantidad * PrecioUnitario * (1 - DescuentoPorcentaje / 100m), 2);
}
