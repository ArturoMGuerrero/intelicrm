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
