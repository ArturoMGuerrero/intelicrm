using InteliCRM.Domain.Enums;

namespace InteliCRM.Application.Common.Interfaces;

public record ResultadoEnvio(EstatusMensaje Estatus, string? Error = null)
{
    public static readonly ResultadoEnvio Simulado = new(EstatusMensaje.Simulado);
    public static readonly ResultadoEnvio Enviado = new(EstatusMensaje.Enviado);
}

/// <summary>
/// Envío de correos (SMTP) y SMS. Si un canal no está configurado, el envío es simulado:
/// no sale nada pero el mensaje queda registrado, para poder probar sin proveedor.
/// </summary>
public interface IEnviadorMensajes
{
    bool CorreoConfigurado { get; }
    bool SmsConfigurado { get; }

    /// <summary>Correo del equipo de soporte de InteliCRM (para la pantalla de Soporte).</summary>
    string? CorreoSoporte { get; }

    Task<ResultadoEnvio> EnviarCorreoAsync(string para, string asunto, string cuerpoTexto, string? responderA, CancellationToken ct);

    /// <summary>Celular de 10 dígitos (México).</summary>
    Task<ResultadoEnvio> EnviarSmsAsync(string celular, string texto, CancellationToken ct);
}
