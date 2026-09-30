using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace InteliCRM.Api.Seguridad;

/// <summary>
/// Exige un permiso para ejecutar el endpoint, p. ej. <c>[Permiso("prospectos.editar")]</c>.
/// </summary>
public class PermisoAttribute(string permiso) : AuthorizeAttribute(Prefijo + permiso)
{
    public const string Prefijo = "Permiso:";
}

public record RequisitoPermiso(string Permiso) : IAuthorizationRequirement;

public class ManejadorPermiso : AuthorizationHandler<RequisitoPermiso>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RequisitoPermiso requisito)
    {
        if (context.User.HasClaim(Claims.Permiso, requisito.Permiso))
            context.Succeed(requisito);
        return Task.CompletedTask;
    }
}

/// <summary>Crea al vuelo una política por cada permiso ("Permiso:clientes.ver", ...).</summary>
public class ProveedorPoliticasPermiso(IOptions<AuthorizationOptions> opciones)
    : DefaultAuthorizationPolicyProvider(opciones)
{
    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string nombre)
    {
        if (nombre.StartsWith(PermisoAttribute.Prefijo, StringComparison.Ordinal))
        {
            return new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(new RequisitoPermiso(nombre[PermisoAttribute.Prefijo.Length..]))
                .Build();
        }
        return await base.GetPolicyAsync(nombre);
    }
}
