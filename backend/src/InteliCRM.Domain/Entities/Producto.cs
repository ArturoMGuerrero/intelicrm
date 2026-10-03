using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

/// <summary>Producto o servicio que se puede cotizar (antes "Artículos").</summary>
public class Producto : EntidadBase
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public TipoProducto Tipo { get; set; }
    public decimal Precio { get; set; }

    /// <summary>Último costo de compra; se propone al hacer órdenes de compra.</summary>
    public decimal Costo { get; set; }

    /// <summary>Si la existencia total baja de este nivel, el producto aparece en faltantes.</summary>
    public decimal? StockMinimo { get; set; }

    /// <summary>Proveedor al que normalmente se le compra (para pedir faltantes).</summary>
    public int? ProveedorId { get; set; }
    public Proveedor? Proveedor { get; set; }

    /// <summary>Solo los productos (no los servicios) llevan inventario.</summary>
    public bool ManejaInventario => Tipo == TipoProducto.Producto;
    public bool Activo { get; set; } = true;
}
