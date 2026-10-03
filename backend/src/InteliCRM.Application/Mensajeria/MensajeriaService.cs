using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.RegularExpressions;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Mensajeria;

public record PlantillaDto(TipoPlantilla Tipo, CanalMensaje Canal, string? Asunto, string Cuerpo, bool Personalizada);

public record EstadoMensajeriaDto(bool CorreoConfigurado, bool SmsConfigurado, IReadOnlyList<string> Variables);

public record MensajeEnviadoDto(
    int Id, DateTime Fecha, CanalMensaje Canal, string Destinatario, string? NombreDestinatario, string? Asunto,
    string Cuerpo, EstatusMensaje Estatus, string? Error, string Origen);

public class GuardarPlantillaRequest
{
    [EnumDataType(typeof(TipoPlantilla))]
    public TipoPlantilla Tipo { get; set; }

    [EnumDataType(typeof(CanalMensaje))]
    public CanalMensaje Canal { get; set; }

    [StringLength(200)]
    public string? Asunto { get; set; }

    [Required, StringLength(2000)]
    public string Cuerpo { get; set; } = string.Empty;
}

public class EnviarRecordatorioRequest
{
    [EnumDataType(typeof(CanalMensaje))]
    public CanalMensaje Canal { get; set; }

    [EnumDataType(typeof(TipoPlantilla))]
    public TipoPlantilla Tipo { get; set; } = TipoPlantilla.RecordatorioCita;
}

/// <summary>
/// Plantillas de mensajes de citas (antes "Definición de mensajes"), envío de confirmaciones
/// y recordatorios, e historial de todo lo enviado.
/// </summary>
public class MensajeriaService(IAppDbContext db, IEnviadorMensajes enviador)
{
    public static readonly IReadOnlyList<string> Variables = ["{prospecto}", "{fecha}", "{hora}", "{ejecutivo}", "{actividad}", "{empresa}"];

    /// <summary>Límite práctico de un SMS (más largo se cobra como varios mensajes).</summary>
    public const int LargoSms = 160;

    private static readonly CultureInfo Mx = CultureInfo.GetCultureInfo("es-MX");

    public EstadoMensajeriaDto Estado() => new(enviador.CorreoConfigurado, enviador.SmsConfigurado, Variables);

    /// <summary>Las cuatro plantillas (tipo × canal); las no personalizadas traen el texto sugerido.</summary>
    public async Task<List<PlantillaDto>> PlantillasAsync(CancellationToken ct)
    {
        var guardadas = await db.PlantillasMensaje.AsNoTracking().ToListAsync(ct);
        return (from tipo in Enum.GetValues<TipoPlantilla>()
                from canal in Enum.GetValues<CanalMensaje>()
                let p = guardadas.FirstOrDefault(x => x.Tipo == tipo && x.Canal == canal)
                select p is null
                    ? Predeterminada(tipo, canal)
                    : new PlantillaDto(tipo, canal, p.Asunto, p.Cuerpo, true)).ToList();
    }

    public async Task<PlantillaDto> GuardarPlantillaAsync(GuardarPlantillaRequest req, CancellationToken ct)
    {
        if (req.Canal == CanalMensaje.Sms && req.Cuerpo.Length > LargoSms * 2)
            throw new ReglaNegocioException($"El SMS es demasiado largo (máximo {LargoSms * 2} caracteres).");
        if (req.Canal == CanalMensaje.Correo && string.IsNullOrWhiteSpace(req.Asunto))
            throw new ReglaNegocioException("El correo necesita un asunto.");

        var plantilla = await db.PlantillasMensaje.FirstOrDefaultAsync(p => p.Tipo == req.Tipo && p.Canal == req.Canal, ct);
        if (plantilla is null)
        {
            plantilla = new PlantillaMensaje { Tipo = req.Tipo, Canal = req.Canal };
            db.PlantillasMensaje.Add(plantilla);
        }
        plantilla.Asunto = req.Canal == CanalMensaje.Correo ? req.Asunto?.Trim() : null;
        plantilla.Cuerpo = req.Cuerpo.Trim();
        await db.SaveChangesAsync(ct);
        return new PlantillaDto(plantilla.Tipo, plantilla.Canal, plantilla.Asunto, plantilla.Cuerpo, true);
    }

    /// <summary>Envía la confirmación o el recordatorio de una cita al prospecto.</summary>
    public async Task<MensajeEnviadoDto> EnviarDeCitaAsync(int citaId, EnviarRecordatorioRequest req, CancellationToken ct)
    {
        var cita = await db.Citas.AsNoTracking()
                       .Include(c => c.Prospecto).Include(c => c.Empleado).Include(c => c.AccionActividad)
                       .FirstOrDefaultAsync(c => c.Id == citaId, ct)
                   ?? throw new NoEncontradoException("Cita", citaId);
        if (cita.Estatus is EstatusCita.Cancelada or EstatusCita.Realizada or EstatusCita.NoAsistio)
            throw new ReglaNegocioException("Solo se envían mensajes de citas programadas o confirmadas.");
        if (cita.FechaHoraInicio < DateTime.Now)
            throw new ReglaNegocioException("La cita ya pasó; no se envían confirmaciones ni recordatorios.");

        var destino = req.Canal == CanalMensaje.Sms
            ? Celular(cita.Prospecto!.Telefono) ?? throw new ReglaNegocioException($"{cita.Prospecto.NombreCompleto} no tiene un celular de 10 dígitos.")
            : cita.Prospecto!.Correo ?? throw new ReglaNegocioException($"{cita.Prospecto.NombreCompleto} no tiene correo.");

        var plantilla = (await PlantillasAsync(ct)).First(p => p.Tipo == req.Tipo && p.Canal == req.Canal);
        var empresa = await NombreEmpresaAsync(ct);
        var valores = new Dictionary<string, string>
        {
            ["{prospecto}"] = cita.Prospecto.NombreCompleto,
            ["{fecha}"] = cita.FechaHoraInicio.ToString("dddd d 'de' MMMM", Mx),
            ["{hora}"] = cita.FechaHoraInicio.ToString("HH:mm", Mx),
            ["{ejecutivo}"] = cita.Empleado?.NombreCompleto ?? "",
            ["{actividad}"] = cita.AccionActividad?.Nombre ?? "cita",
            ["{empresa}"] = empresa,
        };

        var origen = req.Tipo == TipoPlantilla.ConfirmacionCita ? "Confirmación de cita" : "Recordatorio de cita";
        var mensaje = await EnviarYRegistrarAsync(req.Canal, destino, cita.Prospecto.NombreCompleto,
            plantilla.Asunto is null ? null : Reemplazar(plantilla.Asunto, valores), Reemplazar(plantilla.Cuerpo, valores),
            origen, citaId: cita.Id, promocionId: null, ct);

        if (mensaje.Estatus != EstatusMensaje.Error)
            db.Bitacora.Add(new BitacoraEntrada
            {
                ProspectoId = cita.ProspectoId, EmpleadoId = cita.EmpleadoId, Fecha = DateTime.Now,
                Descripcion = $"{origen} enviado por {(req.Canal == CanalMensaje.Sms ? "SMS" : "correo")} a {destino}" +
                              (mensaje.Estatus == EstatusMensaje.Simulado ? " (simulado)." : "."),
            });
        await db.SaveChangesAsync(ct);
        return ADto(mensaje);
    }

    public async Task<List<MensajeEnviadoDto>> HistorialAsync(CanalMensaje? canal, int? citaId, int? promocionId, CancellationToken ct)
    {
        var query = db.MensajesEnviados.AsNoTracking().AsQueryable();
        if (canal is { } c) query = query.Where(m => m.Canal == c);
        if (citaId is { } cid) query = query.Where(m => m.CitaId == cid);
        if (promocionId is { } pid) query = query.Where(m => m.PromocionId == pid);
        var mensajes = await query.OrderByDescending(m => m.Fecha).ThenByDescending(m => m.Id).Take(500).ToListAsync(ct);
        return mensajes.Select(ADto).ToList();
    }

    /// <summary>Envía por el canal indicado y deja el registro en el contexto (no guarda).</summary>
    internal async Task<MensajeEnviado> EnviarYRegistrarAsync(CanalMensaje canal, string destino, string? nombre, string? asunto,
        string cuerpo, string origen, int? citaId, int? promocionId, CancellationToken ct)
    {
        var resultado = canal == CanalMensaje.Sms
            ? await enviador.EnviarSmsAsync(destino, cuerpo, ct)
            : await enviador.EnviarCorreoAsync(destino, asunto ?? origen, cuerpo, null, ct);

        var mensaje = new MensajeEnviado
        {
            Fecha = DateTime.Now, Canal = canal, Destinatario = destino, NombreDestinatario = nombre, Asunto = asunto,
            Cuerpo = cuerpo, Estatus = resultado.Estatus, Error = resultado.Error, Origen = origen,
            CitaId = citaId, PromocionId = promocionId,
        };
        db.MensajesEnviados.Add(mensaje);
        return mensaje;
    }

    internal async Task<string> NombreEmpresaAsync(CancellationToken ct) =>
        await db.ConfiguracionesEmpresa.AsNoTracking().Select(c => c.NombreComercial ?? c.RazonSocial).FirstOrDefaultAsync(ct) ?? "";

    /// <summary>Normaliza un teléfono a 10 dígitos; null si no lo es.</summary>
    internal static string? Celular(string? telefono)
    {
        if (telefono is null) return null;
        var digitos = Regex.Replace(telefono, "[^0-9]", "");
        if (digitos.Length == 12 && digitos.StartsWith("52")) digitos = digitos[2..];
        return digitos.Length == 10 ? digitos : null;
    }

    internal static string Reemplazar(string texto, IReadOnlyDictionary<string, string> valores) =>
        valores.Aggregate(texto, (t, v) => t.Replace(v.Key, v.Value, StringComparison.OrdinalIgnoreCase));

    private static PlantillaDto Predeterminada(TipoPlantilla tipo, CanalMensaje canal) => (tipo, canal) switch
    {
        (TipoPlantilla.ConfirmacionCita, CanalMensaje.Sms) => new(tipo, canal, null,
            "{empresa}: Hola {prospecto}, confirmamos tu {actividad} el {fecha} a las {hora} con {ejecutivo}.", false),
        (TipoPlantilla.RecordatorioCita, CanalMensaje.Sms) => new(tipo, canal, null,
            "{empresa}: Recordatorio de tu {actividad} el {fecha} a las {hora} con {ejecutivo}. ¡Te esperamos!", false),
        (TipoPlantilla.ConfirmacionCita, _) => new(tipo, canal, "Confirmación de tu cita con {empresa}",
            "Hola {prospecto}:\n\nTe confirmamos tu {actividad} el {fecha} a las {hora} con {ejecutivo}.\n\nSaludos,\n{empresa}", false),
        _ => new(tipo, canal, "Recordatorio: tu cita con {empresa}",
            "Hola {prospecto}:\n\nTe recordamos tu {actividad} el {fecha} a las {hora} con {ejecutivo}.\n\nSi necesitas cambiarla, responde a este correo.\n\nSaludos,\n{empresa}", false),
    };

    private static MensajeEnviadoDto ADto(MensajeEnviado m) =>
        new(m.Id, m.Fecha, m.Canal, m.Destinatario, m.NombreDestinatario, m.Asunto, m.Cuerpo, m.Estatus, m.Error, m.Origen);
}
