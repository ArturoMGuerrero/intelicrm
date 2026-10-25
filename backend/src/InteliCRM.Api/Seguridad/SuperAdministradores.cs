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
        // Acepta un arreglo ("...:0", "...:1") o un texto con correos separados por coma.
        var hijos = seccion.GetChildren().Select(h => h.Value ?? "").ToList();
        var valores = hijos.Count > 0 ? hijos : (seccion.Value ?? "").Split(',', ';').ToList();
        return valores.Select(v => v.Trim()).Where(v => v.Length > 0).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }
}
