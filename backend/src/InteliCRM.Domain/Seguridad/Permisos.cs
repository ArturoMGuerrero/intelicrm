namespace InteliCRM.Domain.Seguridad;

/// <summary>
/// Catálogo de permisos del sistema. Cada módulo tiene tres acciones:
/// ver, editar (crear y modificar) y eliminar (dar de baja).
/// El formato es "modulo.accion", p. ej. "prospectos.editar".
/// </summary>
public static class Permisos
{
    public const string Ver = "ver";
    public const string Editar = "editar";
    public const string Eliminar = "eliminar";

    public record Modulo(string Clave, string Nombre, string Grupo);

    public static readonly IReadOnlyList<Modulo> Modulos =
    [
        new("prospectos", "Prospectos y bitácora", "Gestión CRM"),
        new("citas", "Citas", "Gestión CRM"),
        new("cotizaciones", "Cotizaciones", "Gestión CRM"),
        new("clientes", "Clientes", "Catálogos"),
        new("productos", "Productos y servicios", "Catálogos"),
        new("empleados", "Empleados", "Catálogos"),
        new("catalogos", "Puestos, unidades y acciones", "Catálogos"),
        new("usuarios", "Usuarios", "Seguridad"),
        new("roles", "Roles y permisos", "Seguridad"),
    ];

    public static readonly IReadOnlyList<string> Acciones = [Ver, Editar, Eliminar];

    public static readonly IReadOnlyList<string> Todos =
        Modulos.SelectMany(m => Acciones.Select(a => $"{m.Clave}.{a}")).ToList();

    public static bool Existe(string permiso) => Todos.Contains(permiso);
}
