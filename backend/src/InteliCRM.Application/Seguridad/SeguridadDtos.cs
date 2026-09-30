using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using InteliCRM.Domain.Entities;

namespace InteliCRM.Application.Seguridad;

// ---------- Sesión ----------

public class LoginRequest
{
    [Required, EmailAddress]
    public string Correo { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

/// <summary>Datos del usuario que inició sesión. El frontend los usa para el menú y los botones.</summary>
public record SesionDto(
    int UsuarioId, string Nombre, string Correo,
    int CuentaId, string Cuenta,
    int RolId, string Rol, bool EsAdministrador,
    int? EmpleadoId,
    IReadOnlyList<string> Permisos,
    [property: JsonIgnore] string SelloSeguridad); // solo para firmar el token; no se envía al navegador

public class CambiarPasswordRequest
{
    [Required]
    public string PasswordActual { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string PasswordNueva { get; set; } = string.Empty;
}

// ---------- Usuarios ----------

public record UsuarioDto(
    int Id, string Nombre, string Correo,
    int RolId, string? Rol,
    int? EmpleadoId, string? Empleado,
    bool Activo, bool Bloqueado, DateTime? UltimoAcceso)
{
    public static UsuarioDto Desde(Usuario u) => new(
        u.Id, u.Nombre, u.Email ?? "",
        u.RolId, u.Rol?.Nombre,
        u.EmpleadoId, u.Empleado?.NombreCompleto,
        u.Activo,
        u.LockoutEnd is { } fin && fin > DateTimeOffset.UtcNow,
        u.UltimoAcceso);
}

public class GuardarUsuarioRequest
{
    [Required, StringLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Selecciona un rol.")]
    public int RolId { get; set; }

    public int? EmpleadoId { get; set; }
    public bool Activo { get; set; } = true;

    /// <summary>Obligatoria al crear; se ignora al actualizar (usar restablecer contraseña).</summary>
    public string? Password { get; set; }
}

public class RestablecerPasswordRequest
{
    [Required, MinLength(8)]
    public string PasswordNueva { get; set; } = string.Empty;
}

// ---------- Roles ----------

public record RolDto(
    int Id, string Nombre, string? Descripcion, bool EsAdministrador,
    IReadOnlyList<string> Permisos, int Usuarios);

public class GuardarRolRequest
{
    [Required, StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    public List<string> Permisos { get; set; } = [];
}

public record ModuloPermisoDto(string Clave, string Nombre, string Grupo, IReadOnlyList<string> Acciones);
