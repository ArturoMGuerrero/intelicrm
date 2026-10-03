using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Cobranza;

// Piezas compartidas por cuentas por cobrar (cargos) y cuentas por pagar.

public record PagoDto(
    int Id, DateOnly Fecha, decimal Monto, int? InstrumentoPagoId, string? InstrumentoPago,
    string? Referencia, string? Notas, bool Cancelado, DateTime? FechaCancelacion)
{
    public static PagoDto Desde(PagoBase p) => new(
        p.Id, p.Fecha, p.Monto, p.InstrumentoPagoId, p.InstrumentoPago?.Nombre,
        p.Referencia, p.Notas, p.Cancelado, p.FechaCancelacion);
}

public class RegistrarPagoRequest
{
    /// <summary>Si no se indica, se usa la fecha de hoy.</summary>
    public DateOnly? Fecha { get; set; }

    [Range(0.01, 100_000_000, ErrorMessage = "El monto debe ser mayor a cero.")]
    public decimal Monto { get; set; }

    public int? InstrumentoPagoId { get; set; }

    [StringLength(100)]
    public string? Referencia { get; set; }

    [StringLength(500)]
    public string? Notas { get; set; }
}

public class CancelarDocumentoRequest
{
    [Required(ErrorMessage = "Indica el motivo de la cancelación."), StringLength(500)]
    public string Motivo { get; set; } = string.Empty;
}

/// <summary>Filtro de estado del saldo para las listas.</summary>
public enum FiltroEstadoSaldo
{
    /// <summary>Pendientes y vencidos (lo que falta cobrar o pagar).</summary>
    ConSaldo,
    Pendiente,
    Vencido,
    Liquidado,
    Cancelado,
    Todos
}

/// <summary>Totales del tablero de cobranza o de cuentas por pagar, con antigüedad de saldos.</summary>
public record ResumenSaldosDto(
    decimal TotalPorSaldar,
    decimal TotalVencido,
    int DocumentosConSaldo,
    int DocumentosVencidos,
    decimal SaldadoEsteMes,
    decimal AlCorriente,
    decimal Vencido1a30,
    decimal Vencido31a60,
    decimal Vencido61a90,
    decimal VencidoMas90);

internal static class Saldos
{
    public static DateOnly Hoy => DateOnly.FromDateTime(DateTime.Today);

    public static bool Cumple(DocumentoConSaldo d, FiltroEstadoSaldo filtro, DateOnly hoy)
    {
        var estado = d.Estado(hoy);
        return filtro switch
        {
            FiltroEstadoSaldo.ConSaldo => estado is EstadoSaldo.Pendiente or EstadoSaldo.Vencido,
            FiltroEstadoSaldo.Pendiente => estado == EstadoSaldo.Pendiente,
            FiltroEstadoSaldo.Vencido => estado == EstadoSaldo.Vencido,
            FiltroEstadoSaldo.Liquidado => estado == EstadoSaldo.Liquidado,
            FiltroEstadoSaldo.Cancelado => estado == EstadoSaldo.Cancelado,
            _ => true,
        };
    }

    /// <summary>Calcula el resumen. Los decimales se suman en memoria (SQLite no los agrega bien).</summary>
    public static ResumenSaldosDto Resumir(IReadOnlyCollection<DocumentoConSaldo> documentos, IEnumerable<PagoBase> pagosDelMes)
    {
        var hoy = Hoy;
        var conSaldo = documentos.Where(d => d.Estado(hoy) is EstadoSaldo.Pendiente or EstadoSaldo.Vencido).ToList();
        decimal Rango(int desde, int hasta) =>
            conSaldo.Where(d => d.DiasVencido(hoy) >= desde && d.DiasVencido(hoy) <= hasta).Sum(d => d.Saldo);

        return new ResumenSaldosDto(
            TotalPorSaldar: conSaldo.Sum(d => d.Saldo),
            TotalVencido: conSaldo.Where(d => d.Estado(hoy) == EstadoSaldo.Vencido).Sum(d => d.Saldo),
            DocumentosConSaldo: conSaldo.Count,
            DocumentosVencidos: conSaldo.Count(d => d.Estado(hoy) == EstadoSaldo.Vencido),
            SaldadoEsteMes: pagosDelMes.Where(p => !p.Cancelado).Sum(p => p.Monto),
            AlCorriente: conSaldo.Where(d => d.Estado(hoy) == EstadoSaldo.Pendiente).Sum(d => d.Saldo),
            Vencido1a30: Rango(1, 30),
            Vencido31a60: Rango(31, 60),
            Vencido61a90: Rango(61, 90),
            VencidoMas90: Rango(91, int.MaxValue));
    }

    /// <summary>Valida y crea el pago. El llamador lo agrega a la colección del documento.</summary>
    public static async Task<T> NuevoPagoAsync<T>(
        IAppDbContext db, DocumentoConSaldo documento, RegistrarPagoRequest req, CancellationToken ct)
        where T : PagoBase, new()
    {
        if (documento.Estatus == EstatusDocumento.Cancelado)
            throw new ReglaNegocioException($"El documento {documento.Folio} está cancelado.");
        if (documento.Saldo <= 0)
            throw new ReglaNegocioException($"El documento {documento.Folio} ya está liquidado.");
        if (req.Monto > documento.Saldo)
            throw new ReglaNegocioException(
                $"El pago ({Common.FormatoTexto.Moneda(req.Monto)}) es mayor que el saldo pendiente ({Common.FormatoTexto.Moneda(documento.Saldo)}).");

        var fecha = req.Fecha ?? Hoy;
        if (fecha < documento.Fecha)
            throw new ReglaNegocioException("La fecha del pago no puede ser anterior a la del documento.");
        if (fecha > Hoy)
            throw new ReglaNegocioException("No se pueden registrar pagos con fecha futura.");

        if (req.InstrumentoPagoId is { } instId && !await db.InstrumentosPago.AnyAsync(i => i.Id == instId, ct))
            throw new NoEncontradoException("Instrumento de pago", instId);

        return new T
        {
            Fecha = fecha,
            Monto = Math.Round(req.Monto, 2),
            InstrumentoPagoId = req.InstrumentoPagoId,
            Referencia = req.Referencia?.Trim(),
            Notas = req.Notas?.Trim(),
        };
    }

    public static void CancelarPago(DocumentoConSaldo documento, PagoBase? pago, int pagoId)
    {
        if (pago is null) throw new NoEncontradoException("Pago", pagoId);
        if (pago.Cancelado) throw new ReglaNegocioException("El pago ya estaba cancelado.");
        if (documento.Estatus == EstatusDocumento.Cancelado)
            throw new ReglaNegocioException($"El documento {documento.Folio} está cancelado.");

        pago.Cancelado = true;
        pago.FechaCancelacion = DateTime.Now;
        documento.RecalcularSaldo();
    }

    /// <summary>Solo se cancela un documento sin pagos vigentes (primero se cancelan los pagos).</summary>
    public static void CancelarDocumento(DocumentoConSaldo documento, IEnumerable<PagoBase> pagos, string motivo)
    {
        if (documento.Estatus == EstatusDocumento.Cancelado)
            throw new ReglaNegocioException($"El documento {documento.Folio} ya estaba cancelado.");
        if (pagos.Any(p => !p.Cancelado))
            throw new ReglaNegocioException("El documento tiene pagos aplicados; cancélalos primero.");

        documento.Estatus = EstatusDocumento.Cancelado;
        documento.MotivoCancelacion = motivo.Trim();
    }

    /// <summary>Días de crédito: los indicados, o los de la condición de pago, o contado.</summary>
    public static async Task<int> DiasCreditoAsync(IAppDbContext db, int? condicionPagoId, int? diasIndicados, CancellationToken ct)
    {
        int? diasCondicion = null;
        if (condicionPagoId is { } condId)
            diasCondicion = (await db.CondicionesPago.AsNoTracking().FirstOrDefaultAsync(c => c.Id == condId, ct)
                             ?? throw new NoEncontradoException("Condición de pago", condId)).DiasCredito;
        return diasIndicados ?? diasCondicion ?? 0;
    }
}
