using InteliCRM.Domain.Common;
using Microsoft.AspNetCore.Identity;

namespace InteliCRM.Domain.Entities;

/// <summary>Empresa cliente del sistema. Todos los datos de negocio pertenecen a una cuenta.</summary>
public class Cuenta
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool Activa { get; set; } = true;
    public DateTime FechaCreacion { get; set; }
}

/// <summary>
/// Usuario que inicia sesión. Hereda de IdentityUser (hash de contraseña, bloqueo por
/// intentos fallidos, sello de seguridad). El correo es único en todo el sistema.
/// </summary>
public class Usuario : IdentityUser<int>
{
    public string Nombre { get; set; } = string.Empty;

    public int CuentaId { get; set; }
    public Cuenta? Cuenta { get; set; }

    public int RolId { get; set; }
    public Rol? Rol { get; set; }

    /// <summary>Empleado vinculado (opcional), para saber "quién soy" en citas y prospectos.</summary>
    public int? EmpleadoId { get; set; }
    public Empleado? Empleado { get; set; }

    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }
    public DateTime? UltimoAcceso { get; set; }
}

/// <summary>Rol de una cuenta con su lista de permisos (ver <see cref="Seguridad.Permisos"/>).</summary>
public class Rol : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    /// <summary>El administrador tiene todos los permisos, sin importar la lista.</summary>
    public bool EsAdministrador { get; set; }

    public List<string> Permisos { get; set; } = [];

    public IReadOnlyList<string> PermisosEfectivos =>
        EsAdministrador ? Seguridad.Permisos.Todos : Permisos;
}
