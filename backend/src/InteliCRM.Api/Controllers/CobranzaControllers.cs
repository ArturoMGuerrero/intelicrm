using InteliCRM.Application.Cobranza;
using InteliCRM.Api.Seguridad;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

/// <summary>Cargos a clientes/prospectos. Registrar pagos requiere el permiso de cobranza.</summary>
[ApiController]
[Route("api/cargos")]
public class CargosController(CargoService servicio) : ControllerBase
{
    [HttpGet, Permiso("cargos.ver")]
    public Task<List<CargoResumenDto>> Listar([FromQuery] FiltroCargos filtro, CancellationToken ct) =>
        servicio.ListarAsync(filtro, ct);

    [HttpGet("{id:int}"), Permiso("cargos.ver")]
    public Task<CargoDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("cargos.editar")]
    public async Task<ActionResult<CargoDto>> Crear(CrearCargoRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPost("desde-cotizacion/{cotizacionId:int}"), Permiso("cargos.editar")]
    public async Task<ActionResult<CargoDto>> CrearDesdeCotizacion(int cotizacionId, CargoDesdeCotizacionRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearDesdeCotizacionAsync(cotizacionId, req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPost("{id:int}/cancelar"), Permiso("cargos.eliminar")]
    public Task<CargoDto> Cancelar(int id, CancelarDocumentoRequest req, CancellationToken ct) =>
        servicio.CancelarAsync(id, req.Motivo, ct);

    [HttpPost("{id:int}/pagos"), Permiso("cobranza.editar")]
    public Task<CargoDto> RegistrarPago(int id, RegistrarPagoRequest req, CancellationToken ct) =>
        servicio.RegistrarPagoAsync(id, req, ct);

    [HttpPost("{id:int}/pagos/{pagoId:int}/cancelar"), Permiso("cobranza.eliminar")]
    public Task<CargoDto> CancelarPago(int id, int pagoId, CancellationToken ct) =>
        servicio.CancelarPagoAsync(id, pagoId, ct);
}

/// <summary>Cuentas por cobrar: la lista de saldos se arma sobre los cargos.</summary>
[ApiController]
[Route("api/cobranza")]
public class CobranzaController(CargoService servicio) : ControllerBase
{
    [HttpGet, Permiso("cobranza.ver")]
    public Task<List<CargoResumenDto>> Listar([FromQuery] FiltroCargos filtro, CancellationToken ct) =>
        servicio.ListarAsync(filtro, ct);

    [HttpGet("resumen"), Permiso("cobranza.ver")]
    public Task<ResumenSaldosDto> Resumen(CancellationToken ct) => servicio.ResumenAsync(ct);
}

[ApiController]
[Route("api/cuentas-pagar")]
public class CuentasPorPagarController(CuentaPorPagarService servicio) : ControllerBase
{
    [HttpGet, Permiso("cuentas-pagar.ver")]
    public Task<List<CuentaPorPagarResumenDto>> Listar([FromQuery] FiltroCuentasPorPagar filtro, CancellationToken ct) =>
        servicio.ListarAsync(filtro, ct);

    [HttpGet("resumen"), Permiso("cuentas-pagar.ver")]
    public Task<ResumenSaldosDto> Resumen(CancellationToken ct) => servicio.ResumenAsync(ct);

    [HttpGet("{id:int}"), Permiso("cuentas-pagar.ver")]
    public Task<CuentaPorPagarDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("cuentas-pagar.editar")]
    public async Task<ActionResult<CuentaPorPagarDto>> Crear(GuardarCuentaPorPagarRequest req, CancellationToken ct)
    {
        var creada = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creada.Id }, creada);
    }

    [HttpPut("{id:int}"), Permiso("cuentas-pagar.editar")]
    public Task<CuentaPorPagarDto> Actualizar(int id, GuardarCuentaPorPagarRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpPost("{id:int}/cancelar"), Permiso("cuentas-pagar.eliminar")]
    public Task<CuentaPorPagarDto> Cancelar(int id, CancelarDocumentoRequest req, CancellationToken ct) =>
        servicio.CancelarAsync(id, req.Motivo, ct);

    [HttpPost("{id:int}/pagos"), Permiso("cuentas-pagar.editar")]
    public Task<CuentaPorPagarDto> RegistrarPago(int id, RegistrarPagoRequest req, CancellationToken ct) =>
        servicio.RegistrarPagoAsync(id, req, ct);

    [HttpPost("{id:int}/pagos/{pagoId:int}/cancelar"), Permiso("cuentas-pagar.eliminar")]
    public Task<CuentaPorPagarDto> CancelarPago(int id, int pagoId, CancellationToken ct) =>
        servicio.CancelarPagoAsync(id, pagoId, ct);
}
