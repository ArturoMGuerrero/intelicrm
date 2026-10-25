using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

public class Cliente : EntidadBase
{
    public string RazonSocial { get; set; } = string.Empty;
    public string? NombreComercial { get; set; }
    public string? Rfc { get; set; }
    public TipoPersona TipoPersona { get; set; } = TipoPersona.Moral;
    public string? ContactoPrincipal { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    /// <summary>Domicilio fiscal en texto libre.</summary>
    public string? Direccion { get; set; }

    /// <summary>Zona comercial o de reparto (texto libre, p. ej. "Norte", "Bajío").</summary>
    public string? Zona { get; set; }

    /// <summary>Lista de precios especial; sin lista se usan los precios generales.</summary>
    public int? ListaPreciosId { get; set; }
    public ListaPrecios? ListaPrecios { get; set; }

    /// <summary>Tasa de IVA para todo lo que se le vende (p. ej. 0 en exportación). Sin valor, se usa la de cada producto.</summary>
    public decimal? TasaIva { get; set; }

    // Datos para pagos: cómo nos paga el cliente.
    public int? CondicionPagoId { get; set; }
    public CondicionPago? CondicionPago { get; set; }
    public int? InstrumentoPagoId { get; set; }
    public InstrumentoPago? InstrumentoPago { get; set; }
    public string? Banco { get; set; }
    /// <summary>Cuenta de origen de los pagos (normalmente solo los últimos 4 dígitos).</summary>
    public string? NumeroCuenta { get; set; }
    public string? Clabe { get; set; }

    // Contrarecibo: cuándo revisa facturas el cliente.
    /// <summary>Días de revisión separados por coma (Lunes,Miércoles).</summary>
    public string? DiasRevision { get; set; }
    public TimeOnly? HoraRevisionDesde { get; set; }
    public TimeOnly? HoraRevisionHasta { get; set; }
    public string? InstruccionesContrarecibo { get; set; }

    public string? Notas { get; set; }
    public bool Activo { get; set; } = true;

    public ICollection<ContactoCliente> Contactos { get; set; } = new List<ContactoCliente>();
    public ICollection<DireccionCliente> Direcciones { get; set; } = new List<DireccionCliente>();
}

/// <summary>Persona de contacto del cliente (compras, pagos, dirección...).</summary>
public class ContactoCliente : EntidadBase
{
    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public string? Puesto { get; set; }
    public int? TipoContactoId { get; set; }
    public TipoContacto? TipoContacto { get; set; }
    public string? Telefono { get; set; }
    public string? Extension { get; set; }
    public string? Celular { get; set; }
    public string? Correo { get; set; }

    /// <summary>Contacto al que se dirigen cotizaciones y avisos por omisión.</summary>
    public bool Principal { get; set; }
}

/// <summary>Dirección de entrega del cliente (el domicilio fiscal va en <see cref="Cliente.Direccion"/>).</summary>
public class DireccionCliente : EntidadBase
{
    public int ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    /// <summary>Nombre corto para reconocerla: "Matriz", "Bodega Querétaro".</summary>
    public string Nombre { get; set; } = string.Empty;
    public string Calle { get; set; } = string.Empty;
    public string? NumeroExterior { get; set; }
    public string? NumeroInterior { get; set; }
    public string? Colonia { get; set; }
    public string? CodigoPostal { get; set; }
    public string? Municipio { get; set; }
    public string? Estado { get; set; }
    public string Pais { get; set; } = "México";

    /// <summary>Indicaciones para la entrega (horario, referencia, acceso).</summary>
    public string? Instrucciones { get; set; }
    /// <summary>Dirección a la que se envía por omisión.</summary>
    public bool Principal { get; set; }
}
