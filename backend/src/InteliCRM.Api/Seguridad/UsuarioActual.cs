using System.Security.Claims;
using InteliCRM.Application.Common.Interfaces;

namespace InteliCRM.Api.Seguridad;

/// <summary>Nombres de los claims que viajan en el token.</summary>
public static class Claims
{
    public const string UsuarioId = "sub";
    public const string CuentaId = "cuenta";
    public const string Permiso = "permiso";
    public const string SelloSeguridad = "sello";
    public const string Nombre = "name";
}

/// <summary>Lee el usuario y la cuenta del token de la petición actual.</summary>
public class UsuarioActual(IHttpContextAccessor accesor) : IUsuarioActual
{
    private ClaimsPrincipal? Usuario => accesor.HttpContext?.User;

    public int? UsuarioId => LeerEntero(Claims.UsuarioId);
    public int? CuentaId => LeerEntero(Claims.CuentaId);

    private int? LeerEntero(string claim) =>
        Usuario?.Identity?.IsAuthenticated == true && int.TryParse(Usuario.FindFirstValue(claim), out var valor)
            ? valor
            : null;
}
