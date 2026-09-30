namespace InteliCRM.Domain.Common;

/// <summary>
/// Base para todas las entidades de negocio: identificador, cuenta (empresa) a la que
/// pertenecen y auditoría. El DbContext llena estos campos al guardar y filtra
/// automáticamente por la cuenta del usuario que inició sesión.
/// </summary>
public abstract class EntidadBase
{
    public int Id { get; set; }

    /// <summary>Empresa dueña del registro (multi-cuenta).</summary>
    public int CuentaId { get; set; }

    public DateTime FechaCreacion { get; set; }
    public int? CreadoPorId { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public int? ModificadoPorId { get; set; }
}

/// <summary>
/// Base para catálogos simples (Puestos, Unidades de negocio, Acciones y actividades).
/// </summary>
public abstract class CatalogoBase : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
}
