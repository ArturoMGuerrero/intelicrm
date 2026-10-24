using System.ComponentModel.DataAnnotations;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Application.Prospectos;

public record ProspectoDto(
    int Id, string Nombre, string Apellidos, string NombreCompleto,
    string? Empresa, string? Cargo, string? Telefono, string? Correo, string? Origen,
    string? Rfc, DateOnly? FechaNacimiento, string? Calle, string? Colonia, string? CodigoPostal, string? Ciudad, string? Estado,
    EtapaProspecto Etapa, decimal? ValorEstimado, string? Notas, bool Activo,
    int? EmpleadoResponsableId, string? EmpleadoResponsable,
    int? UnidadNegocioId, string? UnidadNegocio,
    int? ClienteId, DateTime FechaCreacion)
{
    public static ProspectoDto Desde(Prospecto p) => new(
        p.Id, p.Nombre, p.Apellidos, p.NombreCompleto,
        p.Empresa, p.Cargo, p.Telefono, p.Correo, p.Origen,
        p.Rfc, p.FechaNacimiento, p.Calle, p.Colonia, p.CodigoPostal, p.Ciudad, p.Estado,
        p.Etapa, p.ValorEstimado, p.Notas, p.Activo,
        p.EmpleadoResponsableId, p.EmpleadoResponsable?.NombreCompleto,
        p.UnidadNegocioId, p.UnidadNegocio?.Nombre,
        p.ClienteId, p.FechaCreacion);
}

public class GuardarProspectoRequest
{
    [Required, StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required, StringLength(150)]
    public string Apellidos { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Empresa { get; set; }

    [StringLength(100)]
    public string? Cargo { get; set; }

    [Phone, StringLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress, StringLength(150)]
    public string? Correo { get; set; }

    [StringLength(100)]
    public string? Origen { get; set; }

    [RegularExpression("^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$", ErrorMessage = "El RFC no tiene un formato válido.")]
    public string? Rfc { get; set; }

    public DateOnly? FechaNacimiento { get; set; }

    [StringLength(200)]
    public string? Calle { get; set; }

    [StringLength(100)]
    public string? Colonia { get; set; }

    [RegularExpression("^[0-9]{5}$", ErrorMessage = "El código postal debe tener 5 dígitos.")]
    public string? CodigoPostal { get; set; }

    [StringLength(100)]
    public string? Ciudad { get; set; }

    [StringLength(100)]
    public string? Estado { get; set; }

    [EnumDataType(typeof(EtapaProspecto))]
    public EtapaProspecto Etapa { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal? ValorEstimado { get; set; }

    [StringLength(2000)]
    public string? Notas { get; set; }

    public int? EmpleadoResponsableId { get; set; }
    public int? UnidadNegocioId { get; set; }
    public bool Activo { get; set; } = true;
}

public class CambiarEtapaRequest
{
    [EnumDataType(typeof(EtapaProspecto))]
    public EtapaProspecto Etapa { get; set; }
}

public record BitacoraDto(
    int Id, int ProspectoId, string? Prospecto, DateTime Fecha, string Descripcion,
    int? EmpleadoId, string? Empleado, int? AccionActividadId, string? AccionActividad,
    DateTime? FechaAviso, bool AvisoAtendido)
{
    /// <summary>Requiere Empleado y AccionActividad cargados; Prospecto es opcional (vistas generales).</summary>
    public static BitacoraDto Desde(BitacoraEntrada b) => new(
        b.Id, b.ProspectoId, b.Prospecto?.NombreCompleto, b.Fecha, b.Descripcion,
        b.EmpleadoId, b.Empleado?.NombreCompleto,
        b.AccionActividadId, b.AccionActividad?.Nombre,
        b.FechaAviso, b.AvisoAtendido);
}

public class AgregarBitacoraRequest
{
    [Required, StringLength(4000)]
    public string Descripcion { get; set; } = string.Empty;

    /// <summary>Si no se indica, se usa la fecha y hora actuales.</summary>
    public DateTime? Fecha { get; set; }

    public int? EmpleadoId { get; set; }
    public int? AccionActividadId { get; set; }

    /// <summary>Fecha para retomar el seguimiento (aparece en Avisos).</summary>
    public DateTime? FechaAviso { get; set; }
}

/// <summary>Prospecto activo sin seguimiento reciente.</summary>
public record ProspectoSinSeguimientoDto(
    int Id, string Nombre, string? Empresa, EtapaProspecto Etapa, string? EmpleadoResponsable,
    DateTime? UltimaBitacora, int DiasSinSeguimiento);
