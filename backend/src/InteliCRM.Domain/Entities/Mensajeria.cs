using InteliCRM.Domain.Common;
using InteliCRM.Domain.Enums;

namespace InteliCRM.Domain.Entities;

/// <summary>
/// Plantilla de mensaje (antes "Definición de mensajes" en Mi empresa). El cuerpo admite
/// variables como {prospecto}, {fecha}, {hora}, {ejecutivo}, {actividad} y {empresa}.
/// </summary>
public class PlantillaMensaje : EntidadBase
{
    public TipoPlantilla Tipo { get; set; }
    public CanalMensaje Canal { get; set; }

    /// <summary>Solo para correo.</summary>
    public string? Asunto { get; set; }
    public string Cuerpo { get; set; } = string.Empty;
}

/// <summary>Registro de cada correo o SMS enviado (o simulado) por el sistema.</summary>
public class MensajeEnviado : EntidadBase
{
    public DateTime Fecha { get; set; }
    public CanalMensaje Canal { get; set; }
    public string Destinatario { get; set; } = string.Empty;
    public string? NombreDestinatario { get; set; }
    public string? Asunto { get; set; }
    public string Cuerpo { get; set; } = string.Empty;

    public EstatusMensaje Estatus { get; set; }
    public string? Error { get; set; }

    /// <summary>Qué lo originó: Recordatorio, Confirmación, Promoción, Soporte.</summary>
    public string Origen { get; set; } = string.Empty;

    public int? CitaId { get; set; }
    public int? PromocionId { get; set; }
}

/// <summary>Campaña de promoción enviada por SMS o correo (antes "Gestión de promociones").</summary>
public class Promocion : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public CanalMensaje Canal { get; set; }
    public string? Asunto { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public DateTime FechaEnvio { get; set; }

    public int Destinatarios { get; set; }
    public int Enviados { get; set; }
    public int Fallidos { get; set; }
}

/// <summary>Archivo descargable: contratos, formatos de alta, políticas (antes "Formatos").</summary>
public class Formato : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public string? Categoria { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string TipoContenido { get; set; } = string.Empty;
    public long Tamano { get; set; }
    public byte[] Contenido { get; set; } = [];
}

/// <summary>Mensaje al equipo de soporte de InteliCRM (antes "Soporte").</summary>
public class TicketSoporte : EntidadBase
{
    public string Asunto { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public string NombreContacto { get; set; } = string.Empty;
    public string CorreoContacto { get; set; } = string.Empty;
    public EstatusMensaje EstatusEnvio { get; set; }
}
