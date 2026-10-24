using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Plataforma;

/// <summary>
/// Quién es superadministrador de la plataforma (puede dar de alta y suspender empresas).
/// Se define por configuración, nunca desde la pantalla, para que nadie se lo pueda dar a sí mismo.
/// </summary>
public interface ISuperAdministradores
{
    bool Es(string? correo);
}

/// <summary>Crea una empresa nueva con sus roles base, catálogos mínimos y su usuario administrador.</summary>
public interface ICreadorCuentas
{
    Task<int> CrearAsync(string empresa, string nombreAdmin, string correoAdmin, string passwordAdmin, CancellationToken ct);
}

public record EmpresaPlataformaDto(
    int Id, string Nombre, bool Activa, DateTime FechaCreacion,
    int Usuarios, int UsuariosActivos, string? Administrador, string? CorreoAdministrador, DateTime? UltimoAcceso);

public class CrearEmpresaRequest
{
    [Required, StringLength(150)]
    public string Empresa { get; set; } = string.Empty;

    [Required, StringLength(150)]
    public string NombreAdministrador { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(256)]
    public string CorreoAdministrador { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string PasswordAdministrador { get; set; } = string.Empty;
}

public class CambiarEstadoEmpresaRequest
{
    public bool Activa { get; set; }
}

/// <summary>
/// Administración de empresas de la plataforma (solo superadministradores). No toca datos de negocio:
/// solo lista las cuentas, crea nuevas y las suspende o reactiva.
/// </summary>
public class EmpresaPlataformaService(IAppDbContext db, ICreadorCuentas creador, IUsuarioActual actual)
{
    public async Task<List<EmpresaPlataformaDto>> ListarAsync(CancellationToken ct)
    {
        var cuentas = await db.Cuentas.AsNoTracking().OrderBy(c => c.Nombre).ToListAsync(ct);
        // Usuarios no tiene filtro por cuenta; aun así se ignoran filtros para incluir el rol de cada cuenta.
        var usuarios = await db.Users.AsNoTracking().IgnoreQueryFilters().Include(u => u.Rol)
            .Select(u => new { u.CuentaId, u.Nombre, u.Email, u.Activo, u.UltimoAcceso, EsAdmin = u.Rol != null && u.Rol.EsAdministrador, u.FechaCreacion })
            .ToListAsync(ct);

        return cuentas.Select(c =>
        {
            var deLaCuenta = usuarios.Where(u => u.CuentaId == c.Id).ToList();
            var admin = deLaCuenta.Where(u => u.EsAdmin).OrderBy(u => u.FechaCreacion).FirstOrDefault();
            return new EmpresaPlataformaDto(
                c.Id, c.Nombre, c.Activa, c.FechaCreacion,
                deLaCuenta.Count, deLaCuenta.Count(u => u.Activo), admin?.Nombre, admin?.Email,
                deLaCuenta.Max(u => u.UltimoAcceso));
        }).ToList();
    }

    public async Task<EmpresaPlataformaDto> CrearAsync(CrearEmpresaRequest req, CancellationToken ct)
    {
        var nombre = req.Empresa.Trim();
        if (await db.Cuentas.AnyAsync(c => c.Nombre.ToLower() == nombre.ToLower(), ct))
            throw new ReglaNegocioException($"Ya existe una empresa llamada «{nombre}».");

        var id = await creador.CrearAsync(nombre, req.NombreAdministrador.Trim(), req.CorreoAdministrador.Trim(), req.PasswordAdministrador, ct);
        return (await ListarAsync(ct)).First(e => e.Id == id);
    }

    public async Task<EmpresaPlataformaDto> CambiarEstadoAsync(int id, bool activa, CancellationToken ct)
    {
        var cuenta = await db.Cuentas.FirstOrDefaultAsync(c => c.Id == id, ct)
                     ?? throw new NoEncontradoException("Empresa", id);
        if (!activa && cuenta.Id == actual.CuentaId)
            throw new ReglaNegocioException("No puedes suspender la empresa con la que iniciaste sesión.");

        cuenta.Activa = activa;
        await db.SaveChangesAsync(ct);
        return (await ListarAsync(ct)).First(e => e.Id == id);
    }
}
