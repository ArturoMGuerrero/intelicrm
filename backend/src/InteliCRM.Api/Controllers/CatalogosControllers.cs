using InteliCRM.Application.Catalogos;
using InteliCRM.Domain.Common;
using InteliCRM.Domain.Entities;
using InteliCRM.Api.Seguridad;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

/// <summary>CRUD común para catálogos simples.</summary>
[ApiController]
public abstract class CatalogoControllerBase<T>(CatalogoService<T> servicio) : ControllerBase
    where T : CatalogoBase, new()
{
    [HttpGet, Permiso("catalogos.ver")]
    public Task<List<CatalogoDto>> Listar([FromQuery] bool incluirInactivos, CancellationToken ct) =>
        servicio.ListarAsync(incluirInactivos, ct);

    [HttpGet("{id:int}"), Permiso("catalogos.ver")]
    public Task<CatalogoDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("catalogos.editar")]
    public async Task<ActionResult<CatalogoDto>> Crear(GuardarCatalogoRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("catalogos.editar")]
    public Task<CatalogoDto> Actualizar(int id, GuardarCatalogoRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    /// <summary>Baja lógica (queda inactivo).</summary>
    [HttpDelete("{id:int}"), Permiso("catalogos.eliminar")]
    public async Task<IActionResult> Desactivar(int id, CancellationToken ct)
    {
        await servicio.DesactivarAsync(id, ct);
        return NoContent();
    }
}

[Route("api/puestos")]
public class PuestosController(CatalogoService<Puesto> s) : CatalogoControllerBase<Puesto>(s);

[Route("api/unidades-negocio")]
public class UnidadesNegocioController(CatalogoService<UnidadNegocio> s) : CatalogoControllerBase<UnidadNegocio>(s);

[Route("api/acciones-actividades")]
public class AccionesActividadesController(CatalogoService<AccionActividad> s) : CatalogoControllerBase<AccionActividad>(s);
