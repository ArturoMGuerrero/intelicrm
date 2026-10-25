using System.Globalization;
using System.Text.Json;
using InteliCRM.Application.TiposCambio;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace InteliCRM.Api.Infrastructure;

/// <summary>
/// Sección "Banxico". El token es gratuito (https://www.banxico.org.mx/SieAPIRest/service/v1/token) y va en
/// user-secrets o variables de entorno, nunca en el repositorio. Sin token, el tipo de cambio se captura a mano.
/// </summary>
public class OpcionesBanxico
{
    public const string Seccion = "Banxico";

    public string? Token { get; set; }

    /// <summary>Serie del SIE: SF43718 = tipo de cambio FIX pesos por dólar.</summary>
    public string Serie { get; set; } = "SF43718";
}

/// <summary>
/// Tipo de cambio FIX desde el API SIE de Banxico. El resultado se guarda en memoria una hora (y los fallos
/// 10 minutos) para no consultar a Banxico en cada pantalla ni por cada empresa.
/// </summary>
public class FuenteBanxico(HttpClient http, IOptions<OpcionesBanxico> opciones, IMemoryCache cache, ILogger<FuenteBanxico> log)
    : IFuenteTipoCambio
{
    private const string ClaveCache = "banxico:fix";

    public bool Configurada => !string.IsNullOrWhiteSpace(opciones.Value.Token);

    public async Task<(DateOnly Fecha, decimal Valor)?> ObtenerAsync(CancellationToken ct)
    {
        if (!Configurada)
            return null;
        if (cache.TryGetValue(ClaveCache, out (DateOnly, decimal)? guardado))
            return guardado;

        var resultado = await ConsultarAsync(ct);
        cache.Set(ClaveCache, resultado, resultado is null ? TimeSpan.FromMinutes(10) : TimeSpan.FromHours(1));
        return resultado;
    }

    private async Task<(DateOnly, decimal)?> ConsultarAsync(CancellationToken ct)
    {
        try
        {
            using var solicitud = new HttpRequestMessage(HttpMethod.Get,
                $"https://www.banxico.org.mx/SieAPIRest/service/v1/series/{opciones.Value.Serie}/datos/oportuno");
            solicitud.Headers.Add("Bmx-Token", opciones.Value.Token);
            solicitud.Headers.Add("Accept", "application/json");

            using var respuesta = await http.SendAsync(solicitud, ct);
            if (!respuesta.IsSuccessStatusCode)
            {
                log.LogWarning("Banxico respondió {Estatus} al consultar el tipo de cambio.", (int)respuesta.StatusCode);
                return null;
            }

            // {"bmx":{"series":[{"idSerie":"SF43718","datos":[{"fecha":"24/10/2026","dato":"18.6670"}]}]}}
            using var json = await JsonDocument.ParseAsync(await respuesta.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var dato = json.RootElement.GetProperty("bmx").GetProperty("series")[0].GetProperty("datos")[0];
            var fecha = DateOnly.ParseExact(dato.GetProperty("fecha").GetString()!, "dd/MM/yyyy", CultureInfo.InvariantCulture);
            var texto = dato.GetProperty("dato").GetString();
            // Banxico pone "N/E" cuando no hay dato publicado.
            if (!decimal.TryParse(texto, NumberStyles.Number, CultureInfo.InvariantCulture, out var valor) || valor <= 0)
                return null;
            return (fecha, valor);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException
                                       or KeyNotFoundException or InvalidOperationException or FormatException or IndexOutOfRangeException)
        {
            log.LogWarning(ex, "No se pudo obtener el tipo de cambio de Banxico.");
            return null;
        }
    }
}
