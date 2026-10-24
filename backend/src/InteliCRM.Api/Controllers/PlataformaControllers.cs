using InteliCRM.Api.Seguridad;
using InteliCRM.Application.Plataforma;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InteliCRM.Api.Controllers;

/// <summary>Empresas de la plataforma: alta, listado y suspensión. Solo superadministradores.</summary>
[ApiController]
[Route("api/plataforma/empresas")]
[Authorize(Policy = SuperAdministradores.Politica)]
public class EmpresasPlataformaController(EmpresaPlataformaService servicio) : ControllerBase
{
    [HttpGet]
    public Task<List<EmpresaPlataformaDto>> Listar(CancellationToken ct) => servicio.ListarAsync(ct);

    [HttpPost]
    public async Task<ActionResult<EmpresaPlataformaDto>> Crear(CrearEmpresaRequest req, CancellationToken ct)
    {
        var creada = await servicio.CrearAsync(req, ct);
        return StatusCode(StatusCodes.Status201Created, creada);
    }

    [HttpPatch("{id:int}/estado")]
    public Task<EmpresaPlataformaDto> CambiarEstado(int id, CambiarEstadoEmpresaRequest req, CancellationToken ct) =>
        servicio.CambiarEstadoAsync(id, req.Activa, ct);
}
