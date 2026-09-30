using InteliCRM.Application.Citas;
using InteliCRM.Application.Clientes;
using InteliCRM.Application.Cotizaciones;
using InteliCRM.Application.Dashboard;
using InteliCRM.Application.Prospectos;
using InteliCRM.Domain.Enums;
using InteliCRM.Api.Seguridad;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController(DashboardService servicio) : ControllerBase
{
    [HttpGet]
    public Task<DashboardDto> Obtener(CancellationToken ct) => servicio.ObtenerAsync(ct);
}

[ApiController]
[Route("api/prospectos")]
public class ProspectosController(ProspectoService servicio) : ControllerBase
{
    [HttpGet, Permiso("prospectos.ver")]
    public Task<List<ProspectoDto>> Listar(
        [FromQuery] string? buscar, [FromQuery] EtapaProspecto? etapa, [FromQuery] int? empleadoId,
        [FromQuery] bool incluirInactivos, CancellationToken ct) =>
        servicio.ListarAsync(buscar, etapa, empleadoId, incluirInactivos, ct);

    [HttpGet("{id:int}"), Permiso("prospectos.ver")]
    public Task<ProspectoDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("prospectos.editar")]
    public async Task<ActionResult<ProspectoDto>> Crear(GuardarProspectoRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("prospectos.editar")]
    public Task<ProspectoDto> Actualizar(int id, GuardarProspectoRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpPatch("{id:int}/etapa"), Permiso("prospectos.editar")]
    public Task<ProspectoDto> CambiarEtapa(int id, CambiarEtapaRequest req, CancellationToken ct) =>
        servicio.CambiarEtapaAsync(id, req.Etapa, ct);

    [HttpPost("{id:int}/convertir-cliente"), Permiso("prospectos.editar"), Permiso("clientes.editar")]
    public Task<ClienteDto> ConvertirEnCliente(int id, CancellationToken ct) =>
        servicio.ConvertirEnClienteAsync(id, ct);

    [HttpDelete("{id:int}"), Permiso("prospectos.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAsync(id, ct);
        return NoContent();
    }

    [HttpGet("{id:int}/bitacora"), Permiso("prospectos.ver")]
    public Task<List<BitacoraDto>> ListarBitacora(int id, CancellationToken ct) =>
        servicio.ListarBitacoraAsync(id, ct);

    [HttpPost("{id:int}/bitacora"), Permiso("prospectos.editar")]
    public Task<BitacoraDto> AgregarBitacora(int id, AgregarBitacoraRequest req, CancellationToken ct) =>
        servicio.AgregarBitacoraAsync(id, req, ct);
}

[ApiController]
[Route("api/citas")]
public class CitasController(CitaService servicio) : ControllerBase
{
    [HttpGet, Permiso("citas.ver")]
    public Task<List<CitaDto>> Listar(
        [FromQuery] DateOnly? desde, [FromQuery] DateOnly? hasta,
        [FromQuery] int? empleadoId, [FromQuery] int? prospectoId, CancellationToken ct) =>
        servicio.ListarAsync(desde, hasta, empleadoId, prospectoId, ct);

    [HttpGet("{id:int}"), Permiso("citas.ver")]
    public Task<CitaDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("citas.editar")]
    public async Task<ActionResult<CitaDto>> Crear(GuardarCitaRequest req, CancellationToken ct)
    {
        var creada = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creada.Id }, creada);
    }

    [HttpPut("{id:int}"), Permiso("citas.editar")]
    public Task<CitaDto> Actualizar(int id, GuardarCitaRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpPatch("{id:int}/estatus"), Permiso("citas.editar")]
    public Task<CitaDto> CambiarEstatus(int id, CambiarEstatusCitaRequest req, CancellationToken ct) =>
        servicio.CambiarEstatusAsync(id, req.Estatus, ct);

    [HttpDelete("{id:int}"), Permiso("citas.eliminar")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await servicio.EliminarAsync(id, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/cotizaciones")]
public class CotizacionesController(CotizacionService servicio) : ControllerBase
{
    [HttpGet, Permiso("cotizaciones.ver")]
    public Task<List<CotizacionResumenDto>> Listar(
        [FromQuery] EstatusCotizacion? estatus, [FromQuery] int? prospectoId, [FromQuery] int? clienteId,
        CancellationToken ct) =>
        servicio.ListarAsync(estatus, prospectoId, clienteId, ct);

    [HttpGet("{id:int}"), Permiso("cotizaciones.ver")]
    public Task<CotizacionDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("cotizaciones.editar")]
    public async Task<ActionResult<CotizacionDto>> Crear(GuardarCotizacionRequest req, CancellationToken ct)
    {
        var creada = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creada.Id }, creada);
    }

    [HttpPut("{id:int}"), Permiso("cotizaciones.editar")]
    public Task<CotizacionDto> Actualizar(int id, GuardarCotizacionRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpPatch("{id:int}/estatus"), Permiso("cotizaciones.editar")]
    public Task<CotizacionDto> CambiarEstatus(int id, CambiarEstatusCotizacionRequest req, CancellationToken ct) =>
        servicio.CambiarEstatusAsync(id, req.Estatus, ct);

    [HttpDelete("{id:int}"), Permiso("cotizaciones.eliminar")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await servicio.EliminarAsync(id, ct);
        return NoContent();
    }
}
