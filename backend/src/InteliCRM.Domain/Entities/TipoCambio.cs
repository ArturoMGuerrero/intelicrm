using InteliCRM.Domain.Common;

namespace InteliCRM.Domain.Entities;

/// <summary>
/// Tipo de cambio del dólar (pesos por dólar) de un día. Se obtiene de Banxico (FIX) o lo captura
/// el administrador; hay a lo más uno por fecha y empresa.
/// </summary>
public class TipoCambio : EntidadBase
{
    public DateOnly Fecha { get; set; }
    public decimal Valor { get; set; }

    /// <summary>"Banxico FIX" o "Manual".</summary>
    public string Fuente { get; set; } = string.Empty;
}
