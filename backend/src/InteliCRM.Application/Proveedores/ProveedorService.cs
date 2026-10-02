using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Proveedores;

public record ProveedorDto(
    int Id, string RazonSocial, string? NombreComercial, string? Rfc, TipoPersona TipoPersona,
    string? Telefono, string? Correo, string? Direccion,
    string? ContactoNombre, string? ContactoTelefono, string? ContactoCorreo,
    int? TipoContactoId, string? TipoContacto,
    int? CondicionPagoId, string? CondicionPago, int? DiasCredito,
    int? InstrumentoPagoId, string? InstrumentoPago,
    string? Banco, string? NumeroCuenta, string? Clabe, string? Notas, bool Activo)
{
    public static ProveedorDto Desde(Proveedor p) => new(
        p.Id, p.RazonSocial, p.NombreComercial, p.Rfc, p.TipoPersona,
        p.Telefono, p.Correo, p.Direccion,
        p.ContactoNombre, p.ContactoTelefono, p.ContactoCorreo,
        p.TipoContactoId, p.TipoContacto?.Nombre,
        p.CondicionPagoId, p.CondicionPago?.Nombre, p.CondicionPago?.DiasCredito,
        p.InstrumentoPagoId, p.InstrumentoPago?.Nombre,
        p.Banco, p.NumeroCuenta, p.Clabe, p.Notas, p.Activo);
}

public class GuardarProveedorRequest
{
    [Required, StringLength(200)]
    public string RazonSocial { get; set; } = string.Empty;

    [StringLength(200)]
    public string? NombreComercial { get; set; }

    [RegularExpression("^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$", ErrorMessage = "El RFC no tiene un formato válido.")]
    public string? Rfc { get; set; }

    public TipoPersona TipoPersona { get; set; } = TipoPersona.Moral;

    [Phone, StringLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress, StringLength(150)]
    public string? Correo { get; set; }

    [StringLength(500)]
    public string? Direccion { get; set; }

    [StringLength(150)]
    public string? ContactoNombre { get; set; }

    [Phone, StringLength(20)]
    public string? ContactoTelefono { get; set; }

    [EmailAddress, StringLength(150)]
    public string? ContactoCorreo { get; set; }

    public int? TipoContactoId { get; set; }
    public int? CondicionPagoId { get; set; }
    public int? InstrumentoPagoId { get; set; }

    [StringLength(100)]
    public string? Banco { get; set; }

    [StringLength(30)]
    public string? NumeroCuenta { get; set; }

    [RegularExpression("^[0-9]{18}$", ErrorMessage = "La CLABE debe tener 18 dígitos.")]
    public string? Clabe { get; set; }

    [StringLength(2000)]
    public string? Notas { get; set; }

    public bool Activo { get; set; } = true;
}

public class ProveedorService(IAppDbContext db)
{
    public async Task<List<ProveedorDto>> ListarAsync(string? buscar, bool incluirInactivos, CancellationToken ct)
    {
        var query = Consulta().Where(p => incluirInactivos || p.Activo);

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var texto = buscar.Trim().ToLower();
            query = query.Where(p =>
                p.RazonSocial.ToLower().Contains(texto) ||
                (p.NombreComercial != null && p.NombreComercial.ToLower().Contains(texto)) ||
                (p.Rfc != null && p.Rfc.ToLower().Contains(texto)) ||
                (p.ContactoNombre != null && p.ContactoNombre.ToLower().Contains(texto)));
        }

        var proveedores = await query.OrderBy(p => p.RazonSocial).ToListAsync(ct);
        return proveedores.Select(ProveedorDto.Desde).ToList();
    }

    public async Task<ProveedorDto> ObtenerAsync(int id, CancellationToken ct) =>
        ProveedorDto.Desde(await Consulta().FirstOrDefaultAsync(p => p.Id == id, ct)
                           ?? throw new NoEncontradoException("Proveedor", id));

    public async Task<ProveedorDto> CrearAsync(GuardarProveedorRequest req, CancellationToken ct)
    {
        await ValidarAsync(req, null, ct);
        var proveedor = new Proveedor();
        Aplicar(proveedor, req);
        db.Proveedores.Add(proveedor);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(proveedor.Id, ct);
    }

    public async Task<ProveedorDto> ActualizarAsync(int id, GuardarProveedorRequest req, CancellationToken ct)
    {
        var proveedor = await BuscarAsync(id, ct);
        await ValidarAsync(req, id, ct);
        Aplicar(proveedor, req);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var proveedor = await BuscarAsync(id, ct);
        proveedor.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    private IQueryable<Proveedor> Consulta() =>
        db.Proveedores.AsNoTracking()
            .Include(p => p.TipoContacto).Include(p => p.CondicionPago).Include(p => p.InstrumentoPago);

    private async Task<Proveedor> BuscarAsync(int id, CancellationToken ct) =>
        await db.Proveedores.FirstOrDefaultAsync(p => p.Id == id, ct)
        ?? throw new NoEncontradoException("Proveedor", id);

    private async Task ValidarAsync(GuardarProveedorRequest req, int? excluirId, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(req.Rfc))
        {
            var rfc = req.Rfc.Trim().ToUpper();
            if (await db.Proveedores.AnyAsync(p => p.Rfc == rfc && p.Id != excluirId, ct))
                throw new ReglaNegocioException($"Ya existe un proveedor con el RFC {rfc}.");
        }
        if (req.TipoContactoId is { } tipoId && !await db.TiposContacto.AnyAsync(x => x.Id == tipoId, ct))
            throw new NoEncontradoException("Tipo de contacto", tipoId);
        if (req.CondicionPagoId is { } condId && !await db.CondicionesPago.AnyAsync(x => x.Id == condId, ct))
            throw new NoEncontradoException("Condición de pago", condId);
        if (req.InstrumentoPagoId is { } instId && !await db.InstrumentosPago.AnyAsync(x => x.Id == instId, ct))
            throw new NoEncontradoException("Instrumento de pago", instId);
    }

    private static void Aplicar(Proveedor p, GuardarProveedorRequest req)
    {
        p.RazonSocial = req.RazonSocial.Trim();
        p.NombreComercial = req.NombreComercial?.Trim();
        p.Rfc = string.IsNullOrWhiteSpace(req.Rfc) ? null : req.Rfc.Trim().ToUpper();
        p.TipoPersona = req.TipoPersona;
        p.Telefono = req.Telefono?.Trim();
        p.Correo = req.Correo?.Trim();
        p.Direccion = req.Direccion?.Trim();
        p.ContactoNombre = req.ContactoNombre?.Trim();
        p.ContactoTelefono = req.ContactoTelefono?.Trim();
        p.ContactoCorreo = req.ContactoCorreo?.Trim();
        p.TipoContactoId = req.TipoContactoId;
        p.CondicionPagoId = req.CondicionPagoId;
        p.InstrumentoPagoId = req.InstrumentoPagoId;
        p.Banco = req.Banco?.Trim();
        p.NumeroCuenta = req.NumeroCuenta?.Trim();
        p.Clabe = string.IsNullOrWhiteSpace(req.Clabe) ? null : req.Clabe.Trim();
        p.Notas = req.Notas?.Trim();
        p.Activo = req.Activo;
    }
}
