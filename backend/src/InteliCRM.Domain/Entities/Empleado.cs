using InteliCRM.Domain.Common;

namespace InteliCRM.Domain.Entities;

/// <summary>Ejecutivo o empleado que atiende prospectos y agenda citas.</summary>
public class Empleado : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Correo { get; set; }

    public int? PuestoId { get; set; }
    public Puesto? Puesto { get; set; }

    public int? UnidadNegocioId { get; set; }
    public UnidadNegocio? UnidadNegocio { get; set; }

    /// <summary>Color hexadecimal con el que se muestran sus citas en la agenda.</summary>
    public string ColorAgenda { get; set; } = "#3b82f6";
    public bool Activo { get; set; } = true;

    public string NombreCompleto => $"{Nombre} {Apellidos}".Trim();
}
