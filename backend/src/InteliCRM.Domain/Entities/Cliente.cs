using InteliCRM.Domain.Common;

namespace InteliCRM.Domain.Entities;

public class Cliente : EntidadBase
{
    public string RazonSocial { get; set; } = string.Empty;
    public string? NombreComercial { get; set; }
    public string? Rfc { get; set; }
    public string? ContactoPrincipal { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Direccion { get; set; }

    /// <summary>Lista de precios especial del cliente (opcional).</summary>
    public int? ListaPreciosId { get; set; }
    public ListaPrecios? ListaPrecios { get; set; }

    public bool Activo { get; set; } = true;
}
