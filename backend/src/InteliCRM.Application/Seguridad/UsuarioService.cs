using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Seguridad;

/// <summary>
/// Administración de usuarios de la cuenta actual. La tabla de usuarios no tiene filtro
/// automático por cuenta, así que TODAS las consultas de aquí filtran por <see cref="CuentaId"/>.
/// </summary>
public class UsuarioService(IAppDbContext db, UserManager<Usuario> usuarios, IUsuarioActual actual)
{
    private int CuentaId => actual.CuentaId ?? throw new InvalidOperationException("No hay sesión.");

    public async Task<List<UsuarioDto>> ListarAsync(CancellationToken ct)
    {
        var lista = await Consulta().OrderBy(u => u.Nombre).ToListAsync(ct);
        return lista.Select(UsuarioDto.Desde).ToList();
    }

    public async Task<UsuarioDto> ObtenerAsync(int id, CancellationToken ct) =>
        UsuarioDto.Desde(await Consulta().FirstOrDefaultAsync(u => u.Id == id, ct)
                         ?? throw new NoEncontradoException("Usuario", id));

    public async Task<UsuarioDto> CrearAsync(GuardarUsuarioRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Password))
            throw new ReglaNegocioException("La contraseña inicial es obligatoria.");

        await ValidarReferenciasAsync(req, ct);

        var usuario = new Usuario
        {
            CuentaId = CuentaId,
            FechaCreacion = DateTime.Now,
            EmailConfirmed = true,
            LockoutEnabled = true,
        };
        Aplicar(usuario, req);

        ResultadoIdentity.Validar(await usuarios.CreateAsync(usuario, req.Password));
        return await ObtenerAsync(usuario.Id, ct);
    }

    public async Task<UsuarioDto> ActualizarAsync(int id, GuardarUsuarioRequest req, CancellationToken ct)
    {
        var usuario = await BuscarAsync(id, ct);
        await ValidarReferenciasAsync(req, ct);

        var esUnoMismo = id == actual.UsuarioId;
        if (esUnoMismo && !req.Activo)
            throw new ReglaNegocioException("No puedes desactivar tu propio usuario.");

        if (await DejariaSinAdministradorAsync(usuario, req.Activo ? req.RolId : null, ct))
            throw new ReglaNegocioException("La cuenta debe conservar al menos un administrador activo.");

        var cambioAcceso = usuario.RolId != req.RolId || usuario.Activo != req.Activo;
        Aplicar(usuario, req);
        ResultadoIdentity.Validar(await usuarios.UpdateAsync(usuario));

        // Invalida las sesiones abiertas para que el cambio de rol o la baja aplique de inmediato.
        if (cambioAcceso)
            await usuarios.UpdateSecurityStampAsync(usuario);

        return await ObtenerAsync(id, ct);
    }

    public async Task RestablecerPasswordAsync(int id, RestablecerPasswordRequest req, CancellationToken ct)
    {
        var usuario = await BuscarAsync(id, ct);

        // Validar antes de quitar la contraseña actual, para no dejar al usuario sin contraseña.
        foreach (var validador in usuarios.PasswordValidators)
            ResultadoIdentity.Validar(await validador.ValidateAsync(usuarios, usuario, req.PasswordNueva));

        ResultadoIdentity.Validar(await usuarios.RemovePasswordAsync(usuario));
        ResultadoIdentity.Validar(await usuarios.AddPasswordAsync(usuario, req.PasswordNueva));
        await usuarios.SetLockoutEndDateAsync(usuario, null);
        await usuarios.ResetAccessFailedCountAsync(usuario);
    }

    public async Task DesbloquearAsync(int id, CancellationToken ct)
    {
        var usuario = await BuscarAsync(id, ct);
        await usuarios.SetLockoutEndDateAsync(usuario, null);
        await usuarios.ResetAccessFailedCountAsync(usuario);
    }

    private IQueryable<Usuario> Consulta() =>
        db.Users.AsNoTracking()
            .Include(u => u.Rol)
            .Include(u => u.Empleado)
            .Where(u => u.CuentaId == CuentaId);

    private async Task<Usuario> BuscarAsync(int id, CancellationToken ct) =>
        await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.CuentaId == CuentaId, ct)
        ?? throw new NoEncontradoException("Usuario", id);

    private async Task ValidarReferenciasAsync(GuardarUsuarioRequest req, CancellationToken ct)
    {
        // Roles y Empleados sí tienen filtro por cuenta: un id de otra empresa "no existe".
        if (!await db.Roles.AnyAsync(r => r.Id == req.RolId, ct))
            throw new NoEncontradoException("Rol", req.RolId);
        if (req.EmpleadoId is { } empleadoId && !await db.Empleados.AnyAsync(e => e.Id == empleadoId, ct))
            throw new NoEncontradoException("Empleado", empleadoId);
    }

    /// <summary>¿Quitarle el rol de administrador (o desactivarlo) dejaría la cuenta sin administradores?</summary>
    private async Task<bool> DejariaSinAdministradorAsync(Usuario usuario, int? nuevoRolId, CancellationToken ct)
    {
        var rolesAdmin = await db.Roles.Where(r => r.EsAdministrador).Select(r => r.Id).ToListAsync(ct);
        var eraAdmin = usuario.Activo && rolesAdmin.Contains(usuario.RolId);
        var seraAdmin = nuevoRolId is { } r && rolesAdmin.Contains(r);
        if (!eraAdmin || seraAdmin)
            return false;

        var otrosAdmins = await db.Users.CountAsync(u =>
            u.CuentaId == CuentaId && u.Id != usuario.Id && u.Activo && rolesAdmin.Contains(u.RolId), ct);
        return otrosAdmins == 0;
    }

    private static void Aplicar(Usuario u, GuardarUsuarioRequest req)
    {
        u.Nombre = req.Nombre.Trim();
        u.Email = req.Correo.Trim();
        u.UserName = req.Correo.Trim();
        u.RolId = req.RolId;
        u.EmpleadoId = req.EmpleadoId;
        u.Activo = req.Activo;
    }
}
