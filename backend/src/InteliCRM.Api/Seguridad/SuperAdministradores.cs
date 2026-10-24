using InteliCRM.Application.Plataforma;

namespace InteliCRM.Api.Seguridad;

/// <summary>
/// Lee los superadministradores de la configuración "Plataforma:SuperAdministradores" (correos separados
/// por coma o como arreglo). Va en user-secrets o variables de entorno, no en el repositorio.
/// </summary>
public class SuperAdministradores(IConfiguration configuracion) : ISuperAdministradores
{
    public const string Politica = "SuperAdministrador";
    public const string Claim = "superadmin";

    private readonly HashSet<string> _correos = Leer(configuracion);

    public bool Es(string? correo) => correo is not null && _correos.Contains(correo.Trim());

    private static HashSet<string> Leer(IConfiguration configuracion)
    {
        var seccion = configuracion.GetSection("Plataforma:SuperAdministradores");
        var valores = seccion.Get<string[]>() ?? (seccion.Value ?? "").Split(',', ';');
        return valores.Select(v => v.Trim()).Where(v => v.Length > 0).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
