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

    /// <summary>Categoría (antes "Tipos de productos y servicios"); su margen sugiere el precio.</summary>
    public int? CategoriaId { get; set; }
    public CategoriaProducto? Categoria { get; set; }

    public string? CodigoBarras { get; set; }
    /// <summary>Código con el que lo conoce el cliente o el fabricante.</summary>
    public string? CodigoAlterno { get; set; }
    /// <summary>Presentación de venta: "Caja con 12", "Bote 1 L".</summary>
    public string? Presentacion { get; set; }
    /// <summary>Unidad de almacenaje: pieza, caja, kg, litro, hora...</summary>
    public string? UnidadMedida { get; set; }
    /// <summary>Ubicación física en el almacén (pasillo, anaquel).</summary>
    public string? Ubicacion { get; set; }

    public decimal Precio { get; set; }

    /// <summary>Tasa de IVA del producto (0, 0.08 o 0.16). Un cliente con tasa propia la reemplaza.</summary>
    public decimal TasaIva { get; set; } = Iva.Predeterminada;

    /// <summary>Precio de mayoreo: se propone desde <see cref="CantidadMayoreo"/> unidades.</summary>
    public decimal? PrecioMayoreo { get; set; }
    public decimal? CantidadMayoreo { get; set; }

    /// <summary>Último costo de compra; se propone al hacer órdenes de compra.</summary>
    public decimal Costo { get; set; }

    /// <summary>Si la existencia total baja de este nivel, el producto aparece en faltantes.</summary>
    public decimal? StockMinimo { get; set; }

    /// <summary>Proveedor al que normalmente se le compra (para pedir faltantes).</summary>
    public int? ProveedorId { get; set; }
    public Proveedor? Proveedor { get; set; }

    /// <summary>Otros proveedores que lo surten, con su código y costo.</summary>
    public ICollection<ProductoProveedor> OtrosProveedores { get; set; } = new List<ProductoProveedor>();

    /// <summary>Imagen como data URL (PNG/JPEG, máx. ~300 KB). No se envía en los listados.</summary>
    public string? Imagen { get; set; }

    /// <summary>Solo los productos (no los servicios) llevan inventario.</summary>
    public bool ManejaInventario => Tipo == TipoProducto.Producto;
    public bool Activo { get; set; } = true;
}

/// <summary>Categoría de productos y servicios con un margen de utilidad sugerido sobre el costo.</summary>
public class CategoriaProducto : CatalogoBase
{
    public string? NombreCorto { get; set; }

    /// <summary>Margen sobre el costo para sugerir el precio (30 = costo + 30 %).</summary>
    public decimal? MargenPorcentaje { get; set; }
}

/// <summary>Proveedor adicional de un producto.</summary>
public class ProductoProveedor : EntidadBase
{
    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }
    public int ProveedorId { get; set; }
    public Proveedor? Proveedor { get; set; }

    /// <summary>Clave del producto en el catálogo del proveedor.</summary>
    public string? CodigoProveedor { get; set; }
    public decimal? Costo { get; set; }
}
