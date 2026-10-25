namespace InteliCRM.Domain.Common;

/// <summary>
/// Tasas de IVA que maneja el sistema: 0 % (exentos, exportación), 8 % (región fronteriza) y 16 % (general).
/// Cada partida guarda su tasa; el IVA del documento se calcula agrupando por tasa.
/// </summary>
public static class Iva
{
    public const decimal Predeterminada = 0.16m;

    public static readonly IReadOnlyList<decimal> TasasPermitidas = [0m, 0.08m, 0.16m];

    public static bool EsValida(decimal tasa) => TasasPermitidas.Contains(tasa);

    /// <summary>IVA de un documento: por cada tasa, (suma de importes × tasa) redondeado a centavos.</summary>
    public static decimal Calcular(IEnumerable<(decimal Importe, decimal Tasa)> partidas) =>
        partidas.GroupBy(p => p.Tasa).Sum(g => Math.Round(g.Sum(p => p.Importe) * g.Key, 2));
}
