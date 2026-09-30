using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Seguridad;

/// <summary>Credenciales incorrectas, usuario inactivo o bloqueado. La API lo convierte en 401.</summary>
public class CredencialesInvalidasException(string mensaje) : Exception(mensaje);

public class AuthService(IAppDbContext db, UserManager<Usuario> usuarios)
{
    // Mismo mensaje para correo inexistente y contraseña incorrecta: no revelar qué correos existen.
    private const string MensajeCredenciales = "Correo o contraseña incorrectos.";

    public async Task<SesionDto> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var usuario = await usuarios.FindByEmailAsync(req.Correo.Trim());
        if (usuario is null)
            throw new CredencialesInvalidasException(MensajeCredenciales);

        if (await usuarios.IsLockedOutAsync(usuario))
            throw new CredencialesInvalidasException(
                "La cuenta está bloqueada temporalmente por varios intentos fallidos. Intenta en unos minutos.");

        if (!await usuarios.CheckPasswordAsync(usuario, req.Password))
        {
            await usuarios.AccessFailedAsync(usuario);
            throw new CredencialesInvalidasException(MensajeCredenciales);
        }

        await usuarios.ResetAccessFailedCountAsync(usuario);

        var sesion = await ObtenerSesionAsync(usuario.Id, ct);

        usuario.UltimoAcceso = DateTime.Now;
        await usuarios.UpdateAsync(usuario);

        return sesion;
    }

    /// <summary>Datos de sesión vigentes. Falla si el usuario o su cuenta ya no están activos.</summary>
    public async Task<SesionDto> ObtenerSesionAsync(int usuarioId, CancellationToken ct)
    {
        var u = await db.Users.AsNoTracking()
            .Include(x => x.Cuenta)
            .Include(x => x.Rol)
            .IgnoreQueryFilters() // el Rol se filtra por cuenta; aquí aún no hay sesión
            .FirstOrDefaultAsync(x => x.Id == usuarioId, ct);

        if (u is null || u.Rol is null || u.Cuenta is null)
            throw new CredencialesInvalidasException(MensajeCredenciales);
        if (!u.Activo)
            throw new CredencialesInvalidasException("Tu usuario está desactivado. Contacta al administrador.");
        if (!u.Cuenta.Activa)
            throw new CredencialesInvalidasException("La cuenta de tu empresa está suspendida.");

        return new SesionDto(
            u.Id, u.Nombre, u.Email ?? "",
            u.CuentaId, u.Cuenta.Nombre,
            u.RolId, u.Rol.Nombre, u.Rol.EsAdministrador,
            u.EmpleadoId,
            u.Rol.PermisosEfectivos,
            u.SecurityStamp ?? "");
    }

    public async Task CambiarPasswordAsync(int usuarioId, CambiarPasswordRequest req)
    {
        var usuario = await usuarios.FindByIdAsync(usuarioId.ToString())
                      ?? throw new NoEncontradoException("Usuario", usuarioId);

        var resultado = await usuarios.ChangePasswordAsync(usuario, req.PasswordActual, req.PasswordNueva);
        ResultadoIdentity.Validar(resultado);
    }
}

internal static class ResultadoIdentity
{
    public static void Validar(IdentityResult resultado)
    {
        if (!resultado.Succeeded)
            // Distinct: Identity reporta el correo duplicado dos veces (como Email y como UserName).
            throw new ReglaNegocioException(string.Join(" ", resultado.Errors.Select(e => e.Description).Distinct()));
    }
}
