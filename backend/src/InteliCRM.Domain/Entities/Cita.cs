using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

public class Cita : EntidadBase
{
    /// <summary>La cita es con un prospecto o con un cliente (uno de los dos).</summary>
    public int? ProspectoId { get; set; }
    public Prospecto? Prospecto { get; set; }
    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    /// <summary>Lugar de la cita o evento (oficina, domicilio del cliente, videollamada...).</summary>
    public string? Lugar { get; set; }

    public int EmpleadoId { get; set; }
    public Empleado? Empleado { get; set; }

    public int? AccionActividadId { get; set; }
    public AccionActividad? AccionActividad { get; set; }

    public DateTime FechaHoraInicio { get; set; }
    public int DuracionMinutos { get; set; } = 30;
    public EstatusCita Estatus { get; set; } = EstatusCita.Programada;
    public string? Notas { get; set; }

    public DateTime FechaHoraFin => FechaHoraInicio.AddMinutes(DuracionMinutos);
}
