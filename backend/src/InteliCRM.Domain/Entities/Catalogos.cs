using InteliCRM.Domain.Common;

namespace InteliCRM.Domain.Entities;

/// <summary>Unidad de negocio (antes "Unidades" en el sistema actual).</summary>
public class UnidadNegocio : CatalogoBase;

/// <summary>Puesto de un empleado (antes "Especialidades").</summary>
public class Puesto : CatalogoBase;

/// <summary>Tipo de acción o actividad comercial: llamada, visita, demo... (antes "Tratamientos").</summary>
public class AccionActividad : CatalogoBase
{
    /// <summary>Duración sugerida al agendar una cita de este tipo.</summary>
    public int DuracionMinutos { get; set; } = 30;
}

/// <summary>Instrumento de pago: efectivo, transferencia, tarjeta, cheque...</summary>
public class InstrumentoPago : CatalogoBase;

/// <summary>Condición de pago: contado, crédito a 30 días...</summary>
public class CondicionPago : CatalogoBase
{
    /// <summary>Días de crédito que otorga la condición (0 = contado).</summary>
    public int DiasCredito { get; set; }
}

/// <summary>Tipo de contacto de un proveedor o cliente: ventas, cobranza, soporte...</summary>
public class TipoContacto : CatalogoBase;

/// <summary>Descripción de servicio (antes "Padecimientos").</summary>
public class DescripcionServicio : CatalogoBase;
