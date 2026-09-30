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
    public bool Activo { get; set; } = true;
}
