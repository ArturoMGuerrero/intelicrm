using System.ComponentModel.DataAnnotations;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Application.Prospectos;

public record ProspectoDto(
    int Id, string Nombre, string Apellidos, string NombreCompleto,
    string? Empresa, string? Cargo, string? Telefono, string? Correo, string? Origen,
    EtapaProspecto Etapa, decimal? ValorEstimado, string? Notas, bool Activo,
    int? EmpleadoResponsableId, string? EmpleadoResponsable,
    int? UnidadNegocioId, string? UnidadNegocio,
    int? ClienteId, DateTime FechaCreacion)
{
    public static ProspectoDto Desde(Prospecto p) => new(
        p.Id, p.Nombre, p.Apellidos, p.NombreCompleto,
        p.Empresa, p.Cargo, p.Telefono, p.Correo, p.Origen,
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
    int Id, int ProspectoId, DateTime Fecha, string Descripcion,
    int? EmpleadoId, string? Empleado, int? AccionActividadId, string? AccionActividad)
{
    public static BitacoraDto Desde(BitacoraEntrada b) => new(
        b.Id, b.ProspectoId, b.Fecha, b.Descripcion,
        b.EmpleadoId, b.Empleado?.NombreCompleto,
        b.AccionActividadId, b.AccionActividad?.Nombre);
}

public class AgregarBitacoraRequest
{
    [Required, StringLength(4000)]
    public string Descripcion { get; set; } = string.Empty;

    /// <summary>Si no se indica, se usa la fecha y hora actuales.</summary>
    public DateTime? Fecha { get; set; }

    public int? EmpleadoId { get; set; }
    public int? AccionActividadId { get; set; }
}
