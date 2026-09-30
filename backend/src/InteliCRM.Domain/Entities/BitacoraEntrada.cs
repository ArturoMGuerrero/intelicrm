using InteliCRM.Domain.Common;

namespace InteliCRM.Domain.Entities;

/// <summary>Registro de seguimiento de un prospecto (antes "Expediente clínico").</summary>
public class BitacoraEntrada : EntidadBase
{
    public int ProspectoId { get; set; }
    public Prospecto? Prospecto { get; set; }

    public int? EmpleadoId { get; set; }
    public Empleado? Empleado { get; set; }

    public int? AccionActividadId { get; set; }
    public AccionActividad? AccionActividad { get; set; }

    public DateTime Fecha { get; set; }
    public string Descripcion { get; set; } = string.Empty;
}
