using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.TiposCambio;

/// <summary>Fuente externa del tipo de cambio (Banxico). Sin token configurado, no está disponible.</summary>
public interface IFuenteTipoCambio
{
    bool Configurada { get; }

    /// <summary>Último tipo de cambio publicado (fecha de publicación y pesos por dólar), o null si falla.</summary>
    Task<(DateOnly Fecha, decimal Valor)?> ObtenerAsync(CancellationToken ct);
}

public record TipoCambioDto(DateOnly Fecha, decimal Valor, string Fuente);

/// <summary>Tipo de cambio vigente, si la fuente automática está configurada, y los últimos registrados.</summary>
public record EstadoTipoCambioDto(TipoCambioDto? Actual, bool FuenteAutomatica, List<TipoCambioDto> Recientes);

public class RegistrarTipoCambioRequest
{
    /// <summary>Si no se indica, hoy.</summary>
    public DateOnly? Fecha { get; set; }

    [Range(1, 1000, ErrorMessage = "Escribe cuántos pesos vale un dólar (p. ej. 18.6670).")]
    public decimal Valor { get; set; }
}

/// <summary>
/// Tipo de cambio del dólar (antes se mostraba en el pie de todas las pantallas). Se consulta a Banxico
/// una vez por día y se guarda; si no hay token o Banxico falla, se usa el último registrado o el que
/// capture el administrador.
/// </summary>
public class TipoCambioService(IAppDbContext db, IFuenteTipoCambio fuente)
{
    public const string FuenteBanxico = "Banxico FIX";
    public const string FuenteManual = "Manual";

    private static DateOnly Hoy => DateOnly.FromDateTime(DateTime.Today);

    public async Task<EstadoTipoCambioDto> EstadoAsync(CancellationToken ct)
    {
        var actual = await ActualAsync(ct);
        var recientes = await db.TiposCambio.AsNoTracking().OrderByDescending(t => t.Fecha).Take(10)
            .Select(t => new TipoCambioDto(t.Fecha, t.Valor, t.Fuente)).ToListAsync(ct);
        return new EstadoTipoCambioDto(actual, fuente.Configurada, recientes);
    }

    /// <summary>
    /// El más reciente. Si no es de hoy, intenta traer de Banxico el último publicado
    /// (en fin de semana o día inhábil Banxico devuelve el del último día hábil).
    /// </summary>
    public async Task<TipoCambioDto?> ActualAsync(CancellationToken ct)
    {
        var ultimo = await UltimoAsync(ct);
        if (ultimo?.Fecha == Hoy || !fuente.Configurada)
            return ultimo;

        var publicado = await fuente.ObtenerAsync(ct);
        if (publicado is not { } p)
            return ultimo;

        // No se pisa un tipo de cambio capturado a mano para esa fecha.
        if (!await db.TiposCambio.AnyAsync(t => t.Fecha == p.Fecha, ct))
        {
            db.TiposCambio.Add(new TipoCambio { Fecha = p.Fecha, Valor = p.Valor, Fuente = FuenteBanxico });
            await db.SaveChangesAsync(ct);
        }
        return await UltimoAsync(ct);
    }

    public async Task<TipoCambioDto> RegistrarAsync(RegistrarTipoCambioRequest req, CancellationToken ct)
    {
        var fecha = req.Fecha ?? Hoy;
        if (fecha > Hoy)
            throw new ReglaNegocioException("No se puede registrar un tipo de cambio de una fecha futura.");

        var existente = await db.TiposCambio.FirstOrDefaultAsync(t => t.Fecha == fecha, ct);
        if (existente is null)
            db.TiposCambio.Add(new TipoCambio { Fecha = fecha, Valor = Math.Round(req.Valor, 4), Fuente = FuenteManual });
        else
        {
            existente.Valor = Math.Round(req.Valor, 4);
            existente.Fuente = FuenteManual;
        }
        await db.SaveChangesAsync(ct);
        return new TipoCambioDto(fecha, Math.Round(req.Valor, 4), FuenteManual);
    }

    private Task<TipoCambioDto?> UltimoAsync(CancellationToken ct) =>
        db.TiposCambio.AsNoTracking().OrderByDescending(t => t.Fecha)
            .Select(t => new TipoCambioDto(t.Fecha, t.Valor, t.Fuente)).FirstOrDefaultAsync(ct);
}
