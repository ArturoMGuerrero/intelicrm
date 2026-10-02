namespace InteliCRM.Domain.Enums;

/// <summary>Etapas del embudo de ventas de un prospecto.</summary>
public enum EtapaProspecto
{
    Nuevo = 0,
    Contactado = 1,
    Calificado = 2,
    Propuesta = 3,
    Negociacion = 4,
    Ganado = 5,
    Perdido = 6
}

public enum EstatusCita
{
    Programada = 0,
    Confirmada = 1,
    Realizada = 2,
    Cancelada = 3,
    NoAsistio = 4
}

public enum EstatusCotizacion
{
    Borrador = 0,
    Enviada = 1,
    Aceptada = 2,
    Rechazada = 3,
    Vencida = 4
}

public enum TipoProducto
{
    Producto = 0,
    Servicio = 1
}

public enum TipoPersona
{
    Fisica = 0,
    Moral = 1
}
