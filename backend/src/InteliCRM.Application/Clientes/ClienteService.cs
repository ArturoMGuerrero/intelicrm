using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Clientes;

public record ClienteDto(
    int Id, string RazonSocial, string? NombreComercial, string? Rfc,
    string? ContactoPrincipal, string? Telefono, string? Correo, string? Direccion, bool Activo)
{
    public static ClienteDto Desde(Cliente c) => new(
        c.Id, c.RazonSocial, c.NombreComercial, c.Rfc, c.ContactoPrincipal,
        c.Telefono, c.Correo, c.Direccion, c.Activo);
}

public class GuardarClienteRequest
{
    [Required, StringLength(200)]
    public string RazonSocial { get; set; } = string.Empty;

    [StringLength(200)]
    public string? NombreComercial { get; set; }

    [RegularExpression("^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$", ErrorMessage = "El RFC no tiene un formato válido.")]
    public string? Rfc { get; set; }

    [StringLength(150)]
    public string? ContactoPrincipal { get; set; }

    [Phone, StringLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress, StringLength(150)]
    public string? Correo { get; set; }

    [StringLength(500)]
    public string? Direccion { get; set; }

    public bool Activo { get; set; } = true;
}

public class ClienteService(IAppDbContext db)
{
    public async Task<List<ClienteDto>> ListarAsync(string? buscar, bool incluirInactivos, CancellationToken ct)
    {
        var query = db.Clientes.AsNoTracking().Where(c => incluirInactivos || c.Activo);

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var texto = buscar.Trim().ToLower();
            query = query.Where(c =>
                c.RazonSocial.ToLower().Contains(texto) ||
                (c.NombreComercial != null && c.NombreComercial.ToLower().Contains(texto)) ||
                (c.Rfc != null && c.Rfc.ToLower().Contains(texto)) ||
                (c.ContactoPrincipal != null && c.ContactoPrincipal.ToLower().Contains(texto)));
        }

        var clientes = await query.OrderBy(c => c.RazonSocial).ToListAsync(ct);
        return clientes.Select(ClienteDto.Desde).ToList();
    }

    public async Task<ClienteDto> ObtenerAsync(int id, CancellationToken ct) =>
        ClienteDto.Desde(await BuscarAsync(id, ct));

    public async Task<ClienteDto> CrearAsync(GuardarClienteRequest req, CancellationToken ct)
    {
        await ValidarRfcUnicoAsync(req.Rfc, null, ct);
        var cliente = new Cliente();
        Aplicar(cliente, req);
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync(ct);
        return ClienteDto.Desde(cliente);
    }

    public async Task<ClienteDto> ActualizarAsync(int id, GuardarClienteRequest req, CancellationToken ct)
    {
        var cliente = await BuscarAsync(id, ct);
        await ValidarRfcUnicoAsync(req.Rfc, id, ct);
        Aplicar(cliente, req);
        await db.SaveChangesAsync(ct);
        return ClienteDto.Desde(cliente);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var cliente = await BuscarAsync(id, ct);
        cliente.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    private async Task<Cliente> BuscarAsync(int id, CancellationToken ct) =>
        await db.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct)
        ?? throw new NoEncontradoException("Cliente", id);

    private async Task ValidarRfcUnicoAsync(string? rfc, int? excluirId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rfc)) return;
        var normalizado = rfc.Trim().ToUpper();
        if (await db.Clientes.AnyAsync(c => c.Rfc == normalizado && c.Id != excluirId, ct))
            throw new ReglaNegocioException($"Ya existe un cliente con el RFC {normalizado}.");
    }

    private static void Aplicar(Cliente c, GuardarClienteRequest req)
    {
        c.RazonSocial = req.RazonSocial.Trim();
        c.NombreComercial = req.NombreComercial?.Trim();
        c.Rfc = string.IsNullOrWhiteSpace(req.Rfc) ? null : req.Rfc.Trim().ToUpper();
        c.ContactoPrincipal = req.ContactoPrincipal?.Trim();
        c.Telefono = req.Telefono?.Trim();
        c.Correo = req.Correo?.Trim();
        c.Direccion = req.Direccion?.Trim();
        c.Activo = req.Activo;
    }
}
