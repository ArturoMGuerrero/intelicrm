using InteliCRM.Application.Empleados;
using InteliCRM.Application.Empresa;
using InteliCRM.Application.Productos;
using InteliCRM.Api.Seguridad;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

[ApiController]
[Route("api/empresa")]
public class EmpresaController(EmpresaService servicio) : ControllerBase
{
    /// <summary>Cualquier usuario con sesión puede leerla: se usa en documentos impresos.</summary>
    [HttpGet, Authorize]
    public Task<ConfiguracionEmpresaDto> Obtener(CancellationToken ct) => servicio.ObtenerAsync(ct);

    [HttpPut, Permiso("empresa.editar")]
    public Task<ConfiguracionEmpresaDto> Guardar(GuardarEmpresaRequest req, CancellationToken ct) => servicio.GuardarAsync(req, ct);
}

[ApiController]
[Route("api/empleados/{empleadoId:int}/horario")]
public class HorariosController(HorarioService servicio) : ControllerBase
{
    [HttpGet, Permiso("empleados.ver")]
    public Task<List<BloqueHorarioDto>> Obtener(int empleadoId, CancellationToken ct) => servicio.ObtenerAsync(empleadoId, ct);

    [HttpPut, Permiso("empleados.editar")]
    public Task<List<BloqueHorarioDto>> Guardar(int empleadoId, GuardarHorarioRequest req, CancellationToken ct) =>
        servicio.GuardarAsync(empleadoId, req, ct);
}

[ApiController]
[Route("api/listas-precios")]
public class ListasPreciosController(ListaPreciosService servicio) : ControllerBase
{
    [HttpGet, Permiso("listas-precios.ver")]
    public Task<List<ListaPreciosResumenDto>> Listar([FromQuery] bool incluirInactivas, CancellationToken ct) =>
        servicio.ListarAsync(incluirInactivas, ct);

    [HttpGet("{id:int}"), Permiso("listas-precios.ver")]
    public Task<ListaPreciosDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("listas-precios.editar")]
    public async Task<ActionResult<ListaPreciosDto>> Crear(GuardarListaPreciosRequest req, CancellationToken ct)
    {
        var creada = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creada.Id }, creada);
    }

    [HttpPut("{id:int}"), Permiso("listas-precios.editar")]
    public Task<ListaPreciosDto> Actualizar(int id, GuardarListaPreciosRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpDelete("{id:int}"), Permiso("listas-precios.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAsync(id, ct);
        return NoContent();
    }

    /// <summary>
    /// Precios especiales de un cliente (productoId → precio). Lo usan las pantallas de cotización
    /// y cargo, por eso basta con poder ver productos.
    /// </summary>
    [HttpGet("cliente/{clienteId:int}"), Permiso("productos.ver")]
    public Task<Dictionary<int, decimal>> PreciosCliente(int clienteId, CancellationToken ct) =>
        servicio.PreciosParaClienteAsync(clienteId, ct);
}
