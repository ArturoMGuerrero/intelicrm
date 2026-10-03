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

/// <summary>Estatus de un cargo o una cuenta por pagar.</summary>
public enum EstatusDocumento
{
    Vigente = 0,
    Cancelado = 1
}

/// <summary>Situación del saldo de un documento (se calcula, no se guarda).</summary>
public enum EstadoSaldo
{
    Pendiente = 0,
    Vencido = 1,
    Liquidado = 2,
    Cancelado = 3
}

public enum TipoMovimientoInventario
{
    EntradaCompra = 0,
    SalidaVenta = 1,
    AjusteEntrada = 2,
    AjusteSalida = 3,
    TraspasoEntrada = 4,
    TraspasoSalida = 5,
    CancelacionVenta = 6
}

public enum EstatusOrdenCompra
{
    Pedida = 0,
    RecibidaParcial = 1,
    Recibida = 2,
    Cancelada = 3
}

public enum CanalMensaje
{
    Correo = 0,
    Sms = 1
}

public enum TipoPlantilla
{
    ConfirmacionCita = 0,
    RecordatorioCita = 1
}

/// <summary>Simulado: no hay proveedor configurado y el mensaje solo se registró.</summary>
public enum EstatusMensaje
{
    Enviado = 0,
    Simulado = 1,
    Error = 2
}
