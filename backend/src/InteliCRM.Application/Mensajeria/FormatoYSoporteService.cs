using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Mensajeria;

public record FormatoDto(int Id, string Nombre, string? Categoria, string NombreArchivo, string TipoContenido, long Tamano, DateTime FechaCreacion);

public record ArchivoDto(string NombreArchivo, string TipoContenido, byte[] Contenido);

/// <summary>Formatos descargables: contratos, solicitudes, políticas (antes "Formatos").</summary>
public class FormatoService(IAppDbContext db)
{
    public const long TamanoMaximo = 5 * 1024 * 1024;

    private static readonly string[] ExtensionesPermitidas =
        [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".png", ".jpg", ".jpeg", ".zip"];

    public async Task<List<FormatoDto>> ListarAsync(CancellationToken ct) =>
        await db.Formatos.AsNoTracking().OrderBy(f => f.Categoria).ThenBy(f => f.Nombre)
            .Select(f => new FormatoDto(f.Id, f.Nombre, f.Categoria, f.NombreArchivo, f.TipoContenido, f.Tamano, f.FechaCreacion))
            .ToListAsync(ct);

    public async Task<FormatoDto> SubirAsync(string nombre, string? categoria, string nombreArchivo, string tipoContenido,
        Stream contenido, long tamano, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(nombre)) throw new ReglaNegocioException("Indica el nombre del formato.");
        if (tamano <= 0) throw new ReglaNegocioException("El archivo está vacío.");
        if (tamano > TamanoMaximo) throw new ReglaNegocioException("El archivo pesa más de 5 MB.");

        var extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();
        if (!ExtensionesPermitidas.Contains(extension))
            throw new ReglaNegocioException($"Tipo de archivo no permitido ({extension}). Usa PDF, Word, Excel, PowerPoint, imágenes, texto o ZIP.");

        using var memoria = new MemoryStream();
        await contenido.CopyToAsync(memoria, ct);

        var formato = new Formato
        {
            Nombre = nombre.Trim(), Categoria = string.IsNullOrWhiteSpace(categoria) ? null : categoria.Trim(),
            NombreArchivo = Path.GetFileName(nombreArchivo), TipoContenido = tipoContenido, Tamano = memoria.Length,
            Contenido = memoria.ToArray(),
        };
        db.Formatos.Add(formato);
        await db.SaveChangesAsync(ct);
        return new FormatoDto(formato.Id, formato.Nombre, formato.Categoria, formato.NombreArchivo, formato.TipoContenido, formato.Tamano, formato.FechaCreacion);
    }

    public async Task<ArchivoDto> DescargarAsync(int id, CancellationToken ct)
    {
        var f = await db.Formatos.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw new NoEncontradoException("Formato", id);
        return new ArchivoDto(f.NombreArchivo, f.TipoContenido, f.Contenido);
    }

    public async Task EliminarAsync(int id, CancellationToken ct)
    {
        var f = await db.Formatos.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NoEncontradoException("Formato", id);
        db.Formatos.Remove(f);
        await db.SaveChangesAsync(ct);
    }
}

public record TicketSoporteDto(int Id, DateTime Fecha, string Asunto, string Mensaje, string NombreContacto, string CorreoContacto, EstatusMensaje EstatusEnvio);

public class CrearTicketRequest
{
    [Required, StringLength(150)]
    public string Asunto { get; set; } = string.Empty;

    [Required, StringLength(4000)]
    public string Mensaje { get; set; } = string.Empty;

    [Required, StringLength(150)]
    public string NombreContacto { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(150)]
    public string CorreoContacto { get; set; } = string.Empty;
}

/// <summary>Mensajes al equipo de soporte (antes "Soporte"). Se guardan y se envían por correo.</summary>
public class SoporteService(IAppDbContext db, IEnviadorMensajes enviador, IUsuarioActual usuario)
{
    public async Task<List<TicketSoporteDto>> ListarAsync(CancellationToken ct) =>
        (await db.TicketsSoporte.AsNoTracking().OrderByDescending(t => t.FechaCreacion).ToListAsync(ct)).Select(ADto).ToList();

    public async Task<TicketSoporteDto> CrearAsync(CrearTicketRequest req, CancellationToken ct)
    {
        var cuenta = await db.Cuentas.AsNoTracking().Where(c => c.Id == usuario.CuentaId).Select(c => c.Nombre).FirstOrDefaultAsync(ct);
        var cuerpo = $"Cuenta: {cuenta} (#{usuario.CuentaId})\nUsuario: #{usuario.UsuarioId}\n" +
                     $"Contacto: {req.NombreContacto.Trim()} <{req.CorreoContacto.Trim()}>\n\n{req.Mensaje.Trim()}";

        var resultado = enviador.CorreoSoporte is { } correoSoporte
            ? await enviador.EnviarCorreoAsync(correoSoporte, $"[Soporte InteliCRM] {req.Asunto.Trim()}", cuerpo, req.CorreoContacto.Trim(), ct)
            : ResultadoEnvio.Simulado;

        var ticket = new TicketSoporte
        {
            Asunto = req.Asunto.Trim(), Mensaje = req.Mensaje.Trim(), NombreContacto = req.NombreContacto.Trim(),
            CorreoContacto = req.CorreoContacto.Trim(), EstatusEnvio = resultado.Estatus,
        };
        db.TicketsSoporte.Add(ticket);
        await db.SaveChangesAsync(ct);

        if (resultado.Estatus == EstatusMensaje.Error)
            throw new ReglaNegocioException($"Tu mensaje se guardó, pero no se pudo enviar por correo: {resultado.Error}");
        return ADto(ticket);
    }

    private static TicketSoporteDto ADto(TicketSoporte t) =>
        new(t.Id, t.FechaCreacion, t.Asunto, t.Mensaje, t.NombreContacto, t.CorreoContacto, t.EstatusEnvio);
}
