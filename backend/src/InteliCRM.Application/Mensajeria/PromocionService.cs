using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Mensajeria;

public record PromocionDto(
    int Id, string Nombre, CanalMensaje Canal, string? Asunto, string Mensaje, DateTime FechaEnvio,
    int Destinatarios, int Enviados, int Fallidos);

/// <summary>Posible destinatario de una promoción, con su dato de contacto para el canal.</summary>
public record DestinatarioDto(string Tipo, int Id, string Nombre, string? Empresa, string? Celular, string? Correo);

public class EnviarPromocionRequest
{
    [Required, StringLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [EnumDataType(typeof(CanalMensaje))]
    public CanalMensaje Canal { get; set; }

    [StringLength(200)]
    public string? Asunto { get; set; }

    [Required, StringLength(2000)]
    public string Mensaje { get; set; } = string.Empty;

    public List<int> ProspectoIds { get; set; } = [];
    public List<int> ClienteIds { get; set; } = [];
}

/// <summary>
/// Promociones por SMS o correo a prospectos y clientes (antes "Gestión de promociones").
/// El mensaje admite {nombre} y {empresa}.
/// </summary>
public class PromocionService(IAppDbContext db, MensajeriaService mensajeria)
{
    /// <summary>Máximo de destinatarios por envío, para no saturar al proveedor ni gastar créditos por error.</summary>
    public const int MaximoDestinatarios = 500;

    public async Task<List<PromocionDto>> ListarAsync(CancellationToken ct) =>
        (await db.Promociones.AsNoTracking().OrderByDescending(p => p.FechaEnvio).ToListAsync(ct)).Select(ADto).ToList();

    /// <summary>Prospectos activos y clientes activos con su celular (10 dígitos) y correo.</summary>
    public async Task<List<DestinatarioDto>> DestinatariosAsync(CancellationToken ct)
    {
        var prospectos = await db.Prospectos.AsNoTracking().Where(p => p.Activo)
            .OrderBy(p => p.Nombre).ThenBy(p => p.Apellidos).ToListAsync(ct);
        var clientes = await db.Clientes.AsNoTracking().Where(c => c.Activo).OrderBy(c => c.RazonSocial).ToListAsync(ct);

        return prospectos.Select(p => new DestinatarioDto("Prospecto", p.Id, p.NombreCompleto, p.Empresa,
                    MensajeriaService.Celular(p.Telefono), p.Correo))
            .Concat(clientes.Select(c => new DestinatarioDto("Cliente", c.Id, c.ContactoPrincipal ?? c.RazonSocial, c.RazonSocial,
                    MensajeriaService.Celular(c.Telefono), c.Correo)))
            .ToList();
    }

    public async Task<PromocionDto> EnviarAsync(EnviarPromocionRequest req, CancellationToken ct)
    {
        if (req.Canal == CanalMensaje.Correo && string.IsNullOrWhiteSpace(req.Asunto))
            throw new ReglaNegocioException("El correo necesita un asunto.");
        if (req.Canal == CanalMensaje.Sms && req.Mensaje.Length > MensajeriaService.LargoSms * 2)
            throw new ReglaNegocioException($"El SMS es demasiado largo (máximo {MensajeriaService.LargoSms * 2} caracteres).");

        var todos = await DestinatariosAsync(ct);
        var elegidos = todos.Where(d =>
                (d.Tipo == "Prospecto" && req.ProspectoIds.Contains(d.Id)) ||
                (d.Tipo == "Cliente" && req.ClienteIds.Contains(d.Id)))
            .Select(d => (d.Nombre, Destino: req.Canal == CanalMensaje.Sms ? d.Celular : d.Correo))
            .Where(d => d.Destino is not null)
            .DistinctBy(d => d.Destino)
            .ToList();

        if (elegidos.Count == 0)
            throw new ReglaNegocioException(req.Canal == CanalMensaje.Sms
                ? "Ninguno de los destinatarios tiene un celular de 10 dígitos."
                : "Ninguno de los destinatarios tiene correo.");
        if (elegidos.Count > MaximoDestinatarios)
            throw new ReglaNegocioException($"Máximo {MaximoDestinatarios} destinatarios por envío.");

        var promocion = new Promocion
        {
            Nombre = req.Nombre.Trim(), Canal = req.Canal, Asunto = req.Canal == CanalMensaje.Correo ? req.Asunto?.Trim() : null,
            Mensaje = req.Mensaje.Trim(), FechaEnvio = DateTime.Now, Destinatarios = elegidos.Count,
        };
        db.Promociones.Add(promocion);
        await db.SaveChangesAsync(ct); // para tener el Id y ligar los mensajes

        var empresa = await mensajeria.NombreEmpresaAsync(ct);
        foreach (var (nombre, destino) in elegidos)
        {
            var valores = new Dictionary<string, string> { ["{nombre}"] = nombre, ["{empresa}"] = empresa };
            var mensaje = await mensajeria.EnviarYRegistrarAsync(req.Canal, destino!, nombre,
                promocion.Asunto is null ? null : MensajeriaService.Reemplazar(promocion.Asunto, valores),
                MensajeriaService.Reemplazar(promocion.Mensaje, valores), "Promoción", null, promocion.Id, ct);
            if (mensaje.Estatus == EstatusMensaje.Error) promocion.Fallidos++;
            else promocion.Enviados++;
        }
        await db.SaveChangesAsync(ct);
        return ADto(promocion);
    }

    private static PromocionDto ADto(Promocion p) =>
        new(p.Id, p.Nombre, p.Canal, p.Asunto, p.Mensaje, p.FechaEnvio, p.Destinatarios, p.Enviados, p.Fallidos);
}
