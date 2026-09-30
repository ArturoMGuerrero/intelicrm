using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

public class Cita : EntidadBase
{
    public int ProspectoId { get; set; }
    public Prospecto? Prospecto { get; set; }

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
