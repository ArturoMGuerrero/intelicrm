using InteliCRM.Domain.Common;

namespace InteliCRM.Domain.Entities;

/// <summary>
/// Datos de la empresa (antes "Mi empresa"): datos fiscales para documentos y facturación,
/// contacto y logo. Hay un registro por cuenta.
/// </summary>
public class ConfiguracionEmpresa : EntidadBase
{
    public string RazonSocial { get; set; } = string.Empty;
    public string? NombreComercial { get; set; }
    public string? Rfc { get; set; }

    /// <summary>Clave del régimen fiscal del SAT (p. ej. 601 General de Ley Personas Morales).</summary>
    public string? RegimenFiscal { get; set; }

    /// <summary>Código postal del domicilio fiscal (lugar de expedición en CFDI).</summary>
    public string? CodigoPostal { get; set; }
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? SitioWeb { get; set; }

    /// <summary>Logo como data URL (image/png o image/jpeg, máx. ~300 KB) para documentos impresos.</summary>
    public string? Logo { get; set; }

    /// <summary>Serie para facturas electrónicas (se usará al timbrar).</summary>
    public string? SerieFactura { get; set; }

    /// <summary>Leyenda al pie de cotizaciones y cargos (condiciones, datos de pago...).</summary>
    public string? PieDocumentos { get; set; }

    public List<CuentaBancariaEmpresa> CuentasBancarias { get; set; } = [];
}

/// <summary>Cuenta bancaria de la empresa para recibir pagos (antes "cuentas_banco").</summary>
public class CuentaBancariaEmpresa : EntidadBase
{
    public int ConfiguracionEmpresaId { get; set; }
    public string Banco { get; set; } = string.Empty;
    public string? NumeroCuenta { get; set; }
    public string? Clabe { get; set; }
    public string? Descripcion { get; set; }
}

/// <summary>Bloque de horario laboral de un empleado en un día de la semana.</summary>
public class HorarioEmpleado : EntidadBase
{
    public int EmpleadoId { get; set; }
    public Empleado? Empleado { get; set; }

    public DayOfWeek Dia { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
}

/// <summary>
/// Lista de precios (p. ej. Mayoreo, Distribuidores). Un cliente puede tener una asignada;
/// los productos sin precio en la lista usan su precio general.
/// </summary>
public class ListaPrecios : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;

    public List<PrecioLista> Precios { get; set; } = [];
}

public class PrecioLista : EntidadBase
{
    public int ListaPreciosId { get; set; }

    public int ProductoId { get; set; }
    public Producto? Producto { get; set; }

    public decimal Precio { get; set; }
}
