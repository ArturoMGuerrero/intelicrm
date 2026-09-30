using InteliCRM.Api.Seguridad;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Application.Seguridad;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace InteliCRM.Api.Controllers;

public record RespuestaLogin(string Token, DateTime Expira, SesionDto Usuario);

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService auth, TokenService tokens, IUsuarioActual actual) : ControllerBase
{
    /// <summary>Inicia sesión y devuelve el token JWT junto con los datos del usuario.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<RespuestaLogin> Login(LoginRequest req, CancellationToken ct)
    {
        var sesion = await auth.LoginAsync(req, ct);
        var token = tokens.Emitir(sesion);
        return new RespuestaLogin(token.Token, token.Expira, sesion);
    }

    /// <summary>Datos vigentes del usuario (el frontend lo llama al recargar la página).</summary>
    [HttpGet("yo")]
    public Task<SesionDto> Yo(CancellationToken ct) => auth.ObtenerSesionAsync(actual.UsuarioId!.Value, ct);

    [HttpPost("cambiar-password")]
    public async Task<IActionResult> CambiarPassword(CambiarPasswordRequest req)
    {
        await auth.CambiarPasswordAsync(actual.UsuarioId!.Value, req);
        return NoContent();
    }
}

[ApiController]
[Route("api/usuarios")]
public class UsuariosController(UsuarioService servicio) : ControllerBase
{
    [HttpGet, Permiso("usuarios.ver")]
    public Task<List<UsuarioDto>> Listar(CancellationToken ct) => servicio.ListarAsync(ct);

    [HttpGet("{id:int}"), Permiso("usuarios.ver")]
    public Task<UsuarioDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("usuarios.editar")]
    public async Task<ActionResult<UsuarioDto>> Crear(GuardarUsuarioRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("usuarios.editar")]
    public Task<UsuarioDto> Actualizar(int id, GuardarUsuarioRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpPost("{id:int}/restablecer-password"), Permiso("usuarios.editar")]
    public async Task<IActionResult> RestablecerPassword(int id, RestablecerPasswordRequest req, CancellationToken ct)
    {
        await servicio.RestablecerPasswordAsync(id, req, ct);
        return NoContent();
    }

    [HttpPost("{id:int}/desbloquear"), Permiso("usuarios.editar")]
    public async Task<IActionResult> Desbloquear(int id, CancellationToken ct)
    {
        await servicio.DesbloquearAsync(id, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/roles")]
public class RolesController(RolService servicio) : ControllerBase
{
    /// <summary>Catálogo de módulos y acciones para armar la pantalla de permisos.</summary>
    [HttpGet("permisos"), Permiso("roles.ver")]
    public List<ModuloPermisoDto> Permisos() => RolService.CatalogoPermisos();

    [HttpGet, Permiso("roles.ver")]
    public Task<List<RolDto>> Listar(CancellationToken ct) => servicio.ListarAsync(ct);

    [HttpGet("{id:int}"), Permiso("roles.ver")]
    public Task<RolDto> Obtener(int id, CancellationToken ct) => servicio.ObtenerAsync(id, ct);

    [HttpPost, Permiso("roles.editar")]
    public async Task<ActionResult<RolDto>> Crear(GuardarRolRequest req, CancellationToken ct)
    {
        var creado = await servicio.CrearAsync(req, ct);
        return CreatedAtAction(nameof(Obtener), new { id = creado.Id }, creado);
    }

    [HttpPut("{id:int}"), Permiso("roles.editar")]
    public Task<RolDto> Actualizar(int id, GuardarRolRequest req, CancellationToken ct) =>
        servicio.ActualizarAsync(id, req, ct);

    [HttpDelete("{id:int}"), Permiso("roles.eliminar")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await servicio.EliminarAsync(id, ct);
        return NoContent();
    }
}
