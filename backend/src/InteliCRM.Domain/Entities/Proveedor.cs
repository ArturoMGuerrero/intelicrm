using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

public class Proveedor : EntidadBase
{
    public string RazonSocial { get; set; } = string.Empty;
    public string? NombreComercial { get; set; }
    public string? Rfc { get; set; }
    public TipoPersona TipoPersona { get; set; } = TipoPersona.Moral;
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Direccion { get; set; }

    // Contacto principal
    public string? ContactoNombre { get; set; }
    public string? ContactoTelefono { get; set; }
    public string? ContactoCorreo { get; set; }
    public int? TipoContactoId { get; set; }
    public TipoContacto? TipoContacto { get; set; }

    // Condiciones comerciales
    public int? CondicionPagoId { get; set; }
    public CondicionPago? CondicionPago { get; set; }
    public int? InstrumentoPagoId { get; set; }
    public InstrumentoPago? InstrumentoPago { get; set; }

    // Datos bancarios para pagos
    public string? Banco { get; set; }
    public string? NumeroCuenta { get; set; }
    public string? Clabe { get; set; }

    public string? Notas { get; set; }
    public bool Activo { get; set; } = true;
}
