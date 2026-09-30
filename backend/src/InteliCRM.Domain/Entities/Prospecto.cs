using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

/// <summary>Posible cliente en seguimiento (antes "Pacientes").</summary>
public class Prospecto : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Empresa { get; set; }
    public string? Cargo { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }

    /// <summary>Cómo llegó: recomendación, web, redes sociales, evento...</summary>
    public string? Origen { get; set; }

    public EtapaProspecto Etapa { get; set; } = EtapaProspecto.Nuevo;
    public decimal? ValorEstimado { get; set; }
    public string? Notas { get; set; }
    public bool Activo { get; set; } = true;

    public int? EmpleadoResponsableId { get; set; }
    public Empleado? EmpleadoResponsable { get; set; }

    public int? UnidadNegocioId { get; set; }
    public UnidadNegocio? UnidadNegocio { get; set; }

    /// <summary>Cliente creado cuando el prospecto se gana.</summary>
    public int? ClienteId { get; set; }
    public Cliente? Cliente { get; set; }

    public ICollection<BitacoraEntrada> Bitacora { get; set; } = new List<BitacoraEntrada>();

    public string NombreCompleto => $"{Nombre} {Apellidos}".Trim();
}
