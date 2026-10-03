using InteliCRM.Application.Mensajeria;
using InteliCRM.Domain.Enums;
using InteliCRM.Api.Seguridad;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

[ApiController]
[Route("api/mensajes")]
public class MensajesController(MensajeriaService servicio) : ControllerBase
{
    /// <summary>Qué canales están configurados (si no, el envío es simulado).</summary>
    [HttpGet("estado"), Authorize]
    public EstadoMensajeriaDto Estado() => servicio.Estado();

    [HttpGet("plantillas"), Permiso("mensajes.ver")]
    public Task<List<PlantillaDto>> Plantillas(CancellationToken ct) => servicio.PlantillasAsync(ct);

    [HttpPut("plantillas"), Permiso("mensajes.editar")]
    public Task<PlantillaDto> GuardarPlantilla(GuardarPlantillaRequest req, CancellationToken ct) => servicio.GuardarPlantillaAsync(req, ct);

    [HttpGet("historial"), Permiso("mensajes.ver")]
    public Task<List<MensajeEnviadoDto>> Historial([FromQuery] CanalMensaje? canal, [FromQuery] int? citaId,
        [FromQuery] int? promocionId, CancellationToken ct) =>
        servicio.HistorialAsync(canal, citaId, promocionId, ct);
}

[ApiController]
[Route("api/citas/{citaId:int}/mensajes")]
public class MensajesCitaController(MensajeriaService servicio) : ControllerBase
{
    /// <summary>Envía la confirmación o el recordatorio de la cita al prospecto.</summary>
    [HttpPost, Permiso("citas.editar")]
    public Task<MensajeEnviadoDto> Enviar(int citaId, EnviarRecordatorioRequest req, CancellationToken ct) =>
        servicio.EnviarDeCitaAsync(citaId, req, ct);

    [HttpGet, Permiso("citas.ver")]
    public Task<List<MensajeEnviadoDto>> Historial(int citaId, CancellationToken ct) =>
        servicio.HistorialAsync(null, citaId, null, ct);
}

[ApiController]
[Route("api/promociones")]
public class PromocionesController(PromocionService servicio) : ControllerBase
{
    [HttpGet, Permiso("promociones.ver")]
    public Task<List<PromocionDto>> Listar(CancellationToken ct) => servicio.ListarAsync(ct);

    [HttpGet("destinatarios"), Permiso("promociones.editar")]
    public Task<List<DestinatarioDto>> Destinatarios(CancellationToken ct) => servicio.DestinatariosAsync(ct);

    [HttpPost, Permiso("promociones.editar")]
    public Task<PromocionDto> Enviar(EnviarPromocionRequest req, CancellationToken ct) => servicio.EnviarAsync(req, ct);
}

[ApiController]
[Route("api/formatos")]
public class FormatosController(FormatoService servicio) : ControllerBase
{
    [HttpGet, Permiso("formatos.ver")]
    public Task<List<FormatoDto>> Listar(CancellationToken ct) => servicio.ListarAsync(ct);

    [HttpPost, Permiso("formatos.editar"), RequestSizeLimit(FormatoService.TamanoMaximo + 64 * 1024)]
    public async Task<FormatoDto> Subir([FromForm] string nombre, [FromForm] string? categoria, IFormFile archivo, CancellationToken ct)
    {
        await using var contenido = archivo.OpenReadStream();
        return await servicio.SubirAsync(nombre, categoria, archivo.FileName,
            string.IsNullOrWhiteSpace(archivo.ContentType) ? "application/octet-stream" : archivo.ContentType,
            contenido, archivo.Length, ct);
    }

    [HttpGet("{id:int}/archivo"), Permiso("formatos.ver")]
    public async Task<IActionResult> Descargar(int id, CancellationToken ct)
    {
        var archivo = await servicio.DescargarAsync(id, ct);
        return File(archivo.Contenido, archivo.TipoContenido, archivo.NombreArchivo);
    }

    [HttpDelete("{id:int}"), Permiso("formatos.eliminar")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await servicio.EliminarAsync(id, ct);
        return NoContent();
    }
}

/// <summary>Cualquier usuario con sesión puede escribir a soporte.</summary>
[ApiController]
[Route("api/soporte"), Authorize]
public class SoporteController(SoporteService servicio) : ControllerBase
{
    [HttpGet]
    public Task<List<TicketSoporteDto>> Listar(CancellationToken ct) => servicio.ListarAsync(ct);

    [HttpPost]
    public Task<TicketSoporteDto> Crear(CrearTicketRequest req, CancellationToken ct) => servicio.CrearAsync(req, ct);
}
