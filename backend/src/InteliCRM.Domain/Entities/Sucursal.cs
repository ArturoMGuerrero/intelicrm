using InteliCRM.Domain.Common;

namespace InteliCRM.Domain.Entities;

public class Sucursal : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? CodigoPostal { get; set; }
    public bool Activo { get; set; } = true;

    public List<Almacen> Almacenes { get; set; } = [];
}

public class Almacen : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public string? Ubicacion { get; set; }

    public int SucursalId { get; set; }
    public Sucursal? Sucursal { get; set; }

    public bool Activo { get; set; } = true;
}
