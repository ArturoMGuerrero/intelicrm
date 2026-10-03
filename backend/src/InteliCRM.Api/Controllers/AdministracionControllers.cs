using InteliCRM.Application.Catalogos;
using InteliCRM.Application.Proveedores;
using InteliCRM.Application.Sucursales;
using InteliCRM.Domain.Entities;
using InteliCRM.Api.Seguridad;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

[Route("api/tipos-contacto")]
public class TiposContactoController(CatalogoService<TipoContacto> s) : CatalogoControllerBase<TipoContacto>(s);

[Route("api/descripciones-servicio")]
public class DescripcionesServicioController(CatalogoService<DescripcionServicio> s) : CatalogoControllerBase<DescripcionServicio>(s);

[Route("api/instrumentos-pago")]
public class InstrumentosPagoController(CatalogoService<InstrumentoPago> s) : CatalogoControllerBase<InstrumentoPago>(s);

[Route("api/condiciones-pago")]
public class CondicionesPagoController(CatalogoService<CondicionPago> s) : CatalogoControllerBase<CondicionPago>(s);

[ApiController]
[Route("api/proveedores")]
public class ProveedoresController(ProveedorService servicio) : ControllerBase
{
    [HttpGet, Permiso("proveedores.ver")]
    public Task<List<ProveedorDto>> Listar([FromQuery] string? buscar, [FromQuery] bool incluirInactivos, CancellationToken ct) =>
        servicio.ListarAsync(buscar, incluirInactivos, ct);

    [HttpGet("{id:int}"), Permiso("proveedores.ver")]
    public Task<ProveedorDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("proveedores.editar")]
    public async Task<ActionResult<ProveedorDto>> Crear(GuardarProveedorRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("proveedores.editar")]
    public Task<ProveedorDto> Actualizar(int id, GuardarProveedorRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpDelete("{id:int}"), Permiso("proveedores.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAsync(id, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/sucursales")]
public class SucursalesController(SucursalService servicio) : ControllerBase
{
    [HttpGet, Permiso("sucursales.ver")]
    public Task<List<SucursalDto>> Listar([FromQuery] bool incluirInactivos, CancellationToken ct) =>
        servicio.ListarAsync(incluirInactivos, ct);

    [HttpGet("{id:int}"), Permiso("sucursales.ver")]
    public Task<SucursalDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("sucursales.editar")]
    public async Task<ActionResult<SucursalDto>> Crear(GuardarSucursalRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("sucursales.editar")]
    public Task<SucursalDto> Actualizar(int id, GuardarSucursalRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpDelete("{id:int}"), Permiso("sucursales.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAsync(id, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/almacenes")]
public class AlmacenesController(SucursalService servicio) : ControllerBase
{
    [HttpGet, Permiso("sucursales.ver")]
    public Task<List<AlmacenDto>> Listar([FromQuery] int? sucursalId, [FromQuery] bool incluirInactivos, CancellationToken ct) =>
        servicio.ListarAlmacenesAsync(sucursalId, incluirInactivos, ct);

    [HttpGet("{id:int}"), Permiso("sucursales.ver")]
    public Task<AlmacenDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAlmacenAsync(id, ct);

    [HttpPost, Permiso("sucursales.editar")]
    public async Task<ActionResult<AlmacenDto>> Crear(GuardarAlmacenRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAlmacenAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("sucursales.editar")]
    public Task<AlmacenDto> Actualizar(int id, GuardarAlmacenRequest req, CancellationToken ct) =>
        servicio.ActualizarAlmacenAsync(id, req, ct);

    [HttpDelete("{id:int}"), Permiso("sucursales.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAlmacenAsync(id, ct);
        return NoContent();
    }
}
