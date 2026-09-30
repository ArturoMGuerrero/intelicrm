using InteliCRM.Application.Clientes;
using InteliCRM.Application.Empleados;
using InteliCRM.Application.Productos;
using InteliCRM.Api.Seguridad;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public class ClientesController(ClienteService servicio) : ControllerBase
{
    [HttpGet, Permiso("clientes.ver")]
    public Task<List<ClienteDto>> Listar([FromQuery] string? buscar, [FromQuery] bool incluirInactivos, CancellationToken ct) =>
        servicio.ListarAsync(buscar, incluirInactivos, ct);

    [HttpGet("{id:int}"), Permiso("clientes.ver")]
    public Task<ClienteDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("clientes.editar")]
    public async Task<ActionResult<ClienteDto>> Crear(GuardarClienteRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("clientes.editar")]
    public Task<ClienteDto> Actualizar(int id, GuardarClienteRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpDelete("{id:int}"), Permiso("clientes.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAsync(id, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/productos")]
public class ProductosController(ProductoService servicio) : ControllerBase
{
    [HttpGet, Permiso("productos.ver")]
    public Task<List<ProductoDto>> Listar([FromQuery] string? buscar, [FromQuery] bool incluirInactivos, CancellationToken ct) =>
        servicio.ListarAsync(buscar, incluirInactivos, ct);

    [HttpGet("{id:int}"), Permiso("productos.ver")]
    public Task<ProductoDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("productos.editar")]
    public async Task<ActionResult<ProductoDto>> Crear(GuardarProductoRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("productos.editar")]
    public Task<ProductoDto> Actualizar(int id, GuardarProductoRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpDelete("{id:int}"), Permiso("productos.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAsync(id, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/empleados")]
public class EmpleadosController(EmpleadoService servicio) : ControllerBase
{
    [HttpGet, Permiso("empleados.ver")]
    public Task<List<EmpleadoDto>> Listar([FromQuery] bool incluirInactivos, CancellationToken ct) =>
        servicio.ListarAsync(incluirInactivos, ct);

    [HttpGet("{id:int}"), Permiso("empleados.ver")]
    public Task<EmpleadoDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("empleados.editar")]
    public async Task<ActionResult<EmpleadoDto>> Crear(GuardarEmpleadoRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("empleados.editar")]
    public Task<EmpleadoDto> Actualizar(int id, GuardarEmpleadoRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpDelete("{id:int}"), Permiso("empleados.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAsync(id, ct);
        return NoContent();
    }
}
