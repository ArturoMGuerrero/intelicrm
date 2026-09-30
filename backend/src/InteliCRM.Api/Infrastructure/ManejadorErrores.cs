using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Seguridad;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Infrastructure;

/// <summary>
/// Convierte las excepciones de la aplicación en respuestas ProblemDetails (RFC 9457).
/// Nunca expone detalles internos del error al cliente.
/// </summary>
public class ManejadorErrores(IProblemDetailsService problemDetails, ILogger<ManejadorErrores> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, titulo) = exception switch
        {
            NoEncontradoException => (StatusCodes.Status404NotFound, "No encontrado"),
            ReglaNegocioException => (StatusCodes.Status409Conflict, "Operación no permitida"),
            CredencialesInvalidasException => (StatusCodes.Status401Unauthorized, "No autorizado"),
            _ => (StatusCodes.Status500InternalServerError, "Error interno")
        };

        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Error no controlado en {Metodo} {Ruta}", context.Request.Method, context.Request.Path);

        context.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = titulo,
                Detail = status == StatusCodes.Status500InternalServerError
                    ? "Ocurrió un error inesperado. Intenta de nuevo."
                    : exception.Message
            }
        });
    }
}
