using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Seguridad;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Seguridad;

public class RolService(IAppDbContext db, UserManager<Usuario> usuarios, IUsuarioActual actual)
{
    public static List<ModuloPermisoDto> CatalogoPermisos() =>
        Permisos.Modulos.Select(m => new ModuloPermisoDto(m.Clave, m.Nombre, m.Grupo, Permisos.Acciones)).ToList();

    public async Task<List<RolDto>> ListarAsync(CancellationToken ct)
    {
        var roles = await db.Roles.AsNoTracking().OrderByDescending(r => r.EsAdministrador).ThenBy(r => r.Nombre).ToListAsync(ct);
        var conteo = await ConteoUsuariosAsync(ct);
        return roles.Select(r => ADto(r, conteo.GetValueOrDefault(r.Id))).ToList();
    }

    public async Task<RolDto> ObtenerAsync(int id, CancellationToken ct)
    {
        var rol = await BuscarAsync(id, ct);
        var conteo = await ConteoUsuariosAsync(ct);
        return ADto(rol, conteo.GetValueOrDefault(id));
    }

    public async Task<RolDto> CrearAsync(GuardarRolRequest req, CancellationToken ct)
    {
        await ValidarAsync(req, null, ct);
        var rol = new Rol();
        Aplicar(rol, req);
        db.Roles.Add(rol);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(rol.Id, ct);
    }

    public async Task<RolDto> ActualizarAsync(int id, GuardarRolRequest req, CancellationToken ct)
    {
        var rol = await BuscarAsync(id, ct);
        await ValidarAsync(req, id, ct);

        var cambiaronPermisos = !rol.Permisos.OrderBy(p => p).SequenceEqual(req.Permisos.Distinct().OrderBy(p => p));
        Aplicar(rol, req);
        await db.SaveChangesAsync(ct);

        // Las sesiones abiertas de este rol deben tomar los permisos nuevos.
        if (cambiaronPermisos && !rol.EsAdministrador)
            await InvalidarSesionesDelRolAsync(id, ct);

        return await ObtenerAsync(id, ct);
    }

    public async Task EliminarAsync(int id, CancellationToken ct)
    {
        var rol = await BuscarAsync(id, ct);
        if (rol.EsAdministrador)
            throw new ReglaNegocioException("El rol de administrador no se puede eliminar.");
        if (await db.Users.AnyAsync(u => u.RolId == id && u.CuentaId == actual.CuentaId, ct))
            throw new ReglaNegocioException("No se puede eliminar un rol que tiene usuarios asignados.");

        db.Roles.Remove(rol);
        await db.SaveChangesAsync(ct);
    }

    private async Task<Rol> BuscarAsync(int id, CancellationToken ct) =>
        await db.Roles.FirstOrDefaultAsync(r => r.Id == id, ct) ?? throw new NoEncontradoException("Rol", id);

    private async Task ValidarAsync(GuardarRolRequest req, int? excluirId, CancellationToken ct)
    {
        var invalidos = req.Permisos.Where(p => !Permisos.Existe(p)).ToList();
        if (invalidos.Count > 0)
            throw new ReglaNegocioException($"Permisos no válidos: {string.Join(", ", invalidos)}.");

        var nombre = req.Nombre.Trim().ToLower();
        if (await db.Roles.AnyAsync(r => r.Nombre.ToLower() == nombre && r.Id != excluirId, ct))
            throw new ReglaNegocioException($"Ya existe un rol llamado '{req.Nombre.Trim()}'.");
    }

    private async Task InvalidarSesionesDelRolAsync(int rolId, CancellationToken ct)
    {
        var afectados = await db.Users.Where(u => u.RolId == rolId && u.CuentaId == actual.CuentaId).ToListAsync(ct);
        foreach (var u in afectados)
            await usuarios.UpdateSecurityStampAsync(u);
    }

    private async Task<Dictionary<int, int>> ConteoUsuariosAsync(CancellationToken ct) =>
        await db.Users.Where(u => u.CuentaId == actual.CuentaId)
            .GroupBy(u => u.RolId)
            .Select(g => new { g.Key, Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Cantidad, ct);

    private static void Aplicar(Rol rol, GuardarRolRequest req)
    {
        rol.Nombre = req.Nombre.Trim();
        rol.Descripcion = req.Descripcion?.Trim();
        if (!rol.EsAdministrador)
            rol.Permisos = req.Permisos.Distinct().OrderBy(p => p).ToList();
    }

    private static RolDto ADto(Rol r, int usuarios) =>
        new(r.Id, r.Nombre, r.Descripcion, r.EsAdministrador, r.PermisosEfectivos, usuarios);
}
