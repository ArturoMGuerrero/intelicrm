using System.Globalization;

namespace InteliCRM.Application.Common;

public static class FormatoTexto
{
    private static readonly CultureInfo Mx = CultureInfo.GetCultureInfo("es-MX");

    /// <summary>Importe con formato de pesos mexicanos ($1,234.50) sin importar la cultura del servidor.</summary>
    public static string Moneda(decimal valor) => valor.ToString("C2", Mx);
}
