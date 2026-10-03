using System.Net;
using System.Net.Mail;
using System.Text.Json;
using InteliCRM.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace InteliCRM.Api.Infrastructure;

/// <summary>
/// Configuración de envío (sección "Mensajeria"). Las credenciales van en user-secrets o variables
/// de entorno, nunca en el repositorio. Si falta un canal, ese canal funciona en modo simulado.
/// </summary>
public class OpcionesMensajeria
{
    public const string Seccion = "Mensajeria";

    public OpcionesCorreo Correo { get; set; } = new();
    public OpcionesSms Sms { get; set; } = new();

    /// <summary>Destino de la pantalla de Soporte.</summary>
    public string? CorreoSoporte { get; set; }
}

public class OpcionesCorreo
{
    public string? Host { get; set; }
    public int Puerto { get; set; } = 587;
    public bool Ssl { get; set; } = true;
    public string? Usuario { get; set; }
    public string? Password { get; set; }
    public string? Remitente { get; set; }
    public string NombreRemitente { get; set; } = "InteliCRM";

    public bool Configurado => !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(Remitente);
}

/// <summary>SMS con smsmasivos.com.mx, el mismo proveedor del sistema original.</summary>
public class OpcionesSms
{
    public string? ApiKey { get; set; }
    public string Url { get; set; } = "https://api.smsmasivos.com.mx/sms/send";
    public string CodigoPais { get; set; } = "52";

    /// <summary>Modo prueba del proveedor: valida pero no entrega ni cobra.</summary>
    public bool Sandbox { get; set; }

    public bool Configurado => !string.IsNullOrWhiteSpace(ApiKey);
}

public class EnviadorMensajes(IOptions<OpcionesMensajeria> opciones, HttpClient http, ILogger<EnviadorMensajes> log) : IEnviadorMensajes
{
    private readonly OpcionesMensajeria _o = opciones.Value;

    public bool CorreoConfigurado => _o.Correo.Configurado;
    public bool SmsConfigurado => _o.Sms.Configurado;
    public string? CorreoSoporte => string.IsNullOrWhiteSpace(_o.CorreoSoporte) ? null : _o.CorreoSoporte;

    public async Task<ResultadoEnvio> EnviarCorreoAsync(string para, string asunto, string cuerpoTexto, string? responderA, CancellationToken ct)
    {
        if (!CorreoConfigurado)
        {
            log.LogInformation("Correo simulado a {Para}: {Asunto}", para, asunto);
            return ResultadoEnvio.Simulado;
        }

        try
        {
            using var mensaje = new MailMessage
            {
                From = new MailAddress(_o.Correo.Remitente!, _o.Correo.NombreRemitente),
                Subject = asunto,
                Body = cuerpoTexto,
                IsBodyHtml = false,
            };
            mensaje.To.Add(para);
            if (!string.IsNullOrWhiteSpace(responderA)) mensaje.ReplyToList.Add(responderA);

            using var smtp = new SmtpClient(_o.Correo.Host, _o.Correo.Puerto) { EnableSsl = _o.Correo.Ssl };
            if (!string.IsNullOrWhiteSpace(_o.Correo.Usuario))
                smtp.Credentials = new NetworkCredential(_o.Correo.Usuario, _o.Correo.Password);
            await smtp.SendMailAsync(mensaje, ct);
            return ResultadoEnvio.Enviado;
        }
        catch (Exception ex) when (ex is SmtpException or FormatException or InvalidOperationException)
        {
            log.LogWarning(ex, "No se pudo enviar el correo a {Para}", para);
            return new ResultadoEnvio(Domain.Enums.EstatusMensaje.Error, ex.Message);
        }
    }

    public async Task<ResultadoEnvio> EnviarSmsAsync(string celular, string texto, CancellationToken ct)
    {
        if (!SmsConfigurado)
        {
            log.LogInformation("SMS simulado a {Celular}: {Texto}", celular, texto);
            return ResultadoEnvio.Simulado;
        }

        // Mismo formato que usaba el sistema original (formulario con apikey, message, numbers, country_code).
        var campos = new Dictionary<string, string>
        {
            ["apikey"] = _o.Sms.ApiKey!,
            ["message"] = texto,
            ["numbers"] = celular,
            ["country_code"] = _o.Sms.CodigoPais,
        };
        if (_o.Sms.Sandbox) campos["sandbox"] = "1";

        try
        {
            using var respuesta = await http.PostAsync(_o.Sms.Url, new FormUrlEncodedContent(campos), ct);
            var cuerpo = await respuesta.Content.ReadAsStringAsync(ct);

            if (respuesta.IsSuccessStatusCode && EsExito(cuerpo)) return ResultadoEnvio.Enviado;
            log.LogWarning("smsmasivos rechazó el SMS a {Celular}: {Respuesta}", celular, cuerpo);
            return new ResultadoEnvio(Domain.Enums.EstatusMensaje.Error, Recortar(cuerpo));
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            log.LogWarning(ex, "Error de comunicación con smsmasivos");
            return new ResultadoEnvio(Domain.Enums.EstatusMensaje.Error, "No se pudo conectar con el proveedor de SMS.");
        }
    }

    /// <summary>smsmasivos responde JSON con "success": true cuando acepta el envío.</summary>
    private static bool EsExito(string cuerpo)
    {
        try
        {
            using var json = JsonDocument.Parse(cuerpo);
            return json.RootElement.TryGetProperty("success", out var exito) && exito.ValueKind == JsonValueKind.True;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string Recortar(string texto) => texto.Length > 300 ? texto[..300] : texto;
}
