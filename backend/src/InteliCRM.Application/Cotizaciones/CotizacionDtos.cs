using System.ComponentModel.DataAnnotations;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Application.Cotizaciones;

public record CotizacionResumenDto(
    int Id, string Folio, DateOnly Fecha, DateOnly FechaVencimiento,
    int? ProspectoId, int? ClienteId, string Destinatario,
    string? Empleado, EstatusCotizacion Estatus, decimal Total)
{
    public static CotizacionResumenDto Desde(Cotizacion c) => new(
        c.Id, c.Folio, c.Fecha, c.FechaVencimiento,
        c.ProspectoId, c.ClienteId, NombreDestinatario(c),
        c.Empleado?.NombreCompleto, c.Estatus, c.Total);

    internal static string NombreDestinatario(Cotizacion c) =>
        c.Cliente?.RazonSocial
        ?? (c.Prospecto is null ? "" :
            string.IsNullOrWhiteSpace(c.Prospecto.Empresa)
                ? c.Prospecto.NombreCompleto
                : $"{c.Prospecto.NombreCompleto} ({c.Prospecto.Empresa})");
}

public record PartidaDto(
    int Id, int? ProductoId, string Descripcion, decimal Cantidad,
    decimal PrecioUnitario, decimal DescuentoPorcentaje, decimal Importe);

public record CotizacionDto(
    int Id, string Folio, DateOnly Fecha, int VigenciaDias, DateOnly FechaVencimiento,
    int? ProspectoId, int? ClienteId, string Destinatario,
    int? EmpleadoId, string? Empleado,
    EstatusCotizacion Estatus, string? Notas,
    decimal Subtotal, decimal Iva, decimal Total,
    List<PartidaDto> Partidas)
{
    public static CotizacionDto Desde(Cotizacion c) => new(
        c.Id, c.Folio, c.Fecha, c.VigenciaDias, c.FechaVencimiento,
        c.ProspectoId, c.ClienteId, CotizacionResumenDto.NombreDestinatario(c),
        c.EmpleadoId, c.Empleado?.NombreCompleto,
        c.Estatus, c.Notas, c.Subtotal, c.Iva, c.Total,
        c.Partidas.OrderBy(p => p.Id)
            .Select(p => new PartidaDto(p.Id, p.ProductoId, p.Descripcion, p.Cantidad,
                                        p.PrecioUnitario, p.DescuentoPorcentaje, p.Importe))
            .ToList());
}

public class GuardarCotizacionRequest
{
    public int? ProspectoId { get; set; }
    public int? ClienteId { get; set; }
    public int? EmpleadoId { get; set; }

    /// <summary>Si no se indica, se usa la fecha de hoy.</summary>
    public DateOnly? Fecha { get; set; }

    [Range(1, 365)]
    public int VigenciaDias { get; set; } = 15;

    [StringLength(2000)]
    public string? Notas { get; set; }

    [MinLength(1, ErrorMessage = "La cotización debe tener al menos una partida.")]
    public List<GuardarPartidaRequest> Partidas { get; set; } = [];
}

public class GuardarPartidaRequest
{
    /// <summary>Opcional: si se indica, se toman descripción y precio del producto cuando vengan vacíos.</summary>
    public int? ProductoId { get; set; }

    [StringLength(500)]
    public string? Descripcion { get; set; }

    [Range(0.01, 1_000_000)]
    public decimal Cantidad { get; set; } = 1;

    [Range(0, 100_000_000)]
    public decimal? PrecioUnitario { get; set; }

    [Range(0, 100)]
    public decimal DescuentoPorcentaje { get; set; }
}

public class CambiarEstatusCotizacionRequest
{
    [EnumDataType(typeof(EstatusCotizacion))]
    public EstatusCotizacion Estatus { get; set; }
}
