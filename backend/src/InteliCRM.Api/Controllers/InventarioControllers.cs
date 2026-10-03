using InteliCRM.Application.Cobranza;
using InteliCRM.Application.Compras;
using InteliCRM.Application.Inventario;
using InteliCRM.Api.Seguridad;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

[ApiController]
[Route("api/inventario")]
public class InventarioController(InventarioService servicio) : ControllerBase
{
    [HttpGet("existencias"), Permiso("inventario.ver")]
    public Task<List<ExistenciaDto>> Existencias([FromQuery] FiltroExistencias filtro, CancellationToken ct) =>
        servicio.ExistenciasAsync(filtro, ct);

    [HttpGet("kardex"), Permiso("inventario.ver")]
    public Task<List<MovimientoDto>> Kardex([FromQuery] FiltroKardex filtro, CancellationToken ct) =>
        servicio.KardexAsync(filtro, ct);

    [HttpPost("ajustes"), Permiso("inventario.editar")]
    public Task<ExistenciaDto> Ajustar(AjusteInventarioRequest req, CancellationToken ct) => servicio.AjustarAsync(req, ct);

    [HttpPost("traspasos"), Permiso("inventario.editar")]
    public async Task<IActionResult> Traspasar(TraspasoRequest req, CancellationToken ct)
    {
        await servicio.TraspasarAsync(req, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/compras")]
public class ComprasController(CompraService servicio) : ControllerBase
{
    [HttpGet, Permiso("compras.ver")]
    public Task<List<OrdenCompraResumenDto>> Listar([FromQuery] FiltroOrdenesCompra filtro, CancellationToken ct) =>
        servicio.ListarAsync(filtro, ct);

    [HttpGet("faltantes"), Permiso("compras.ver")]
    public Task<List<FaltanteDto>> Faltantes(CancellationToken ct) => servicio.FaltantesAsync(ct);

    [HttpPost("faltantes"), Permiso("compras.editar")]
    public Task<List<OrdenCompraResumenDto>> PedirFaltantes(PedirFaltantesRequest req, CancellationToken ct) =>
        servicio.PedirFaltantesAsync(req, ct);

    [HttpGet("{id:int}"), Permiso("compras.ver")]
    public Task<OrdenCompraDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("compras.editar")]
    public async Task<ActionResult<OrdenCompraDto>> Crear(GuardarOrdenCompraRequest req, CancellationToken ct)
    {
        var creada = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creada.Id }, creada);
    }

    [HttpPut("{id:int}"), Permiso("compras.editar")]
    public Task<OrdenCompraDto> Actualizar(int id, GuardarOrdenCompraRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpPost("{id:int}/cancelar"), Permiso("compras.eliminar")]
    public Task<OrdenCompraDto> Cancelar(int id, CancelarDocumentoRequest req, CancellationToken ct) =>
        servicio.CancelarAsync(id, req.Motivo, ct);

    /// <summary>Recibir mercancía ("Aplicar compra"): entra al almacén y genera la cuenta por pagar.</summary>
    [HttpPost("{id:int}/recepciones"), Permiso("compras.editar")]
    public Task<OrdenCompraDto> Recibir(int id, RecibirCompraRequest req, CancellationToken ct) =>
        servicio.RecibirAsync(id, req, ct);
}
