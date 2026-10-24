using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Clientes;

public record ContactoClienteDto(
    int Id, string Nombre, string? Puesto, int? TipoContactoId, string? TipoContacto,
    string? Telefono, string? Extension, string? Celular, string? Correo, bool Principal);

public record DireccionClienteDto(
    int Id, string Nombre, string Calle, string? NumeroExterior, string? NumeroInterior, string? Colonia,
    string? CodigoPostal, string? Municipio, string? Estado, string Pais, string? Instrucciones, bool Principal);

public record ClienteDto(
    int Id, string RazonSocial, string? NombreComercial, string? Rfc, TipoPersona TipoPersona,
    string? ContactoPrincipal, string? Telefono, string? Correo, string? Direccion, string? Zona,
    int? ListaPreciosId, string? ListaPrecios,
    int? CondicionPagoId, string? CondicionPago, int? DiasCredito,
    int? InstrumentoPagoId, string? InstrumentoPago,
    string? Banco, string? NumeroCuenta, string? Clabe,
    string? DiasRevision, TimeOnly? HoraRevisionDesde, TimeOnly? HoraRevisionHasta, string? InstruccionesContrarecibo,
    string? Notas, bool Activo,
    List<ContactoClienteDto> Contactos, List<DireccionClienteDto> Direcciones)
{
    public static ClienteDto Desde(Cliente c) => new(
        c.Id, c.RazonSocial, c.NombreComercial, c.Rfc, c.TipoPersona,
        c.ContactoPrincipal, c.Telefono, c.Correo, c.Direccion, c.Zona,
        c.ListaPreciosId, c.ListaPrecios?.Nombre,
        c.CondicionPagoId, c.CondicionPago?.Nombre, c.CondicionPago?.DiasCredito,
        c.InstrumentoPagoId, c.InstrumentoPago?.Nombre,
        c.Banco, c.NumeroCuenta, c.Clabe,
        c.DiasRevision, c.HoraRevisionDesde, c.HoraRevisionHasta, c.InstruccionesContrarecibo,
        c.Notas, c.Activo,
        c.Contactos.OrderByDescending(x => x.Principal).ThenBy(x => x.Nombre)
            .Select(x => new ContactoClienteDto(x.Id, x.Nombre, x.Puesto, x.TipoContactoId, x.TipoContacto?.Nombre,
                x.Telefono, x.Extension, x.Celular, x.Correo, x.Principal)).ToList(),
        c.Direcciones.OrderByDescending(x => x.Principal).ThenBy(x => x.Nombre)
            .Select(x => new DireccionClienteDto(x.Id, x.Nombre, x.Calle, x.NumeroExterior, x.NumeroInterior, x.Colonia,
                x.CodigoPostal, x.Municipio, x.Estado, x.Pais, x.Instrucciones, x.Principal)).ToList());
}

public class GuardarContactoClienteRequest
{
    [Required, StringLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Puesto { get; set; }

    public int? TipoContactoId { get; set; }

    [Phone, StringLength(20)]
    public string? Telefono { get; set; }

    [StringLength(10)]
    public string? Extension { get; set; }

    [Phone, StringLength(20)]
    public string? Celular { get; set; }

    [EmailAddress, StringLength(150)]
    public string? Correo { get; set; }

    public bool Principal { get; set; }
}

public class GuardarDireccionClienteRequest
{
    [Required, StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Calle { get; set; } = string.Empty;

    [StringLength(20)]
    public string? NumeroExterior { get; set; }

    [StringLength(20)]
    public string? NumeroInterior { get; set; }

    [StringLength(100)]
    public string? Colonia { get; set; }

    [RegularExpression("^[0-9]{5}$", ErrorMessage = "El código postal debe tener 5 dígitos.")]
    public string? CodigoPostal { get; set; }

    [StringLength(100)]
    public string? Municipio { get; set; }

    [StringLength(100)]
    public string? Estado { get; set; }

    [StringLength(60)]
    public string? Pais { get; set; }

    [StringLength(500)]
    public string? Instrucciones { get; set; }

    public bool Principal { get; set; }
}

public class GuardarClienteRequest
{
    public static readonly string[] DiasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    [Required, StringLength(200)]
    public string RazonSocial { get; set; } = string.Empty;

    [StringLength(200)]
    public string? NombreComercial { get; set; }

    [RegularExpression("^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$", ErrorMessage = "El RFC no tiene un formato válido.")]
    public string? Rfc { get; set; }

    public TipoPersona TipoPersona { get; set; } = TipoPersona.Moral;

    /// <summary>Solo se usa si el cliente no tiene contactos; con contactos se toma el principal.</summary>
    [StringLength(150)]
    public string? ContactoPrincipal { get; set; }

    [Phone, StringLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress, StringLength(150)]
    public string? Correo { get; set; }

    [StringLength(500)]
    public string? Direccion { get; set; }

    [StringLength(100)]
    public string? Zona { get; set; }

    public int? ListaPreciosId { get; set; }
    public int? CondicionPagoId { get; set; }
    public int? InstrumentoPagoId { get; set; }

    [StringLength(100)]
    public string? Banco { get; set; }

    [StringLength(30)]
    public string? NumeroCuenta { get; set; }

    [RegularExpression("^[0-9]{18}$", ErrorMessage = "La CLABE debe tener 18 dígitos.")]
    public string? Clabe { get; set; }

    /// <summary>Días en que el cliente revisa facturas (Lunes, Martes, ...).</summary>
    public List<string> DiasRevision { get; set; } = [];
    public TimeOnly? HoraRevisionDesde { get; set; }
    public TimeOnly? HoraRevisionHasta { get; set; }

    [StringLength(1000)]
    public string? InstruccionesContrarecibo { get; set; }

    [StringLength(2000)]
    public string? Notas { get; set; }

    public bool Activo { get; set; } = true;

    public List<GuardarContactoClienteRequest> Contactos { get; set; } = [];
    public List<GuardarDireccionClienteRequest> Direcciones { get; set; } = [];
}

public class ClienteService(IAppDbContext db)
{
    private IQueryable<Cliente> ConDetalle() => db.Clientes.AsNoTracking()
        .Include(c => c.ListaPrecios).Include(c => c.CondicionPago).Include(c => c.InstrumentoPago)
        .Include(c => c.Contactos).ThenInclude(x => x.TipoContacto)
        .Include(c => c.Direcciones);

    public async Task<List<ClienteDto>> ListarAsync(string? buscar, bool incluirInactivos, CancellationToken ct)
    {
        var query = ConDetalle().Where(c => incluirInactivos || c.Activo);

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var texto = buscar.Trim().ToLower();
            query = query.Where(c =>
                c.RazonSocial.ToLower().Contains(texto) ||
                (c.NombreComercial != null && c.NombreComercial.ToLower().Contains(texto)) ||
                (c.Rfc != null && c.Rfc.ToLower().Contains(texto)) ||
                (c.ContactoPrincipal != null && c.ContactoPrincipal.ToLower().Contains(texto)) ||
                (c.Zona != null && c.Zona.ToLower().Contains(texto)) ||
                c.Contactos.Any(x => x.Nombre.ToLower().Contains(texto) || (x.Correo != null && x.Correo.ToLower().Contains(texto))));
        }

        var clientes = await query.OrderBy(c => c.RazonSocial).ToListAsync(ct);
        return clientes.Select(ClienteDto.Desde).ToList();
    }

    public async Task<ClienteDto> ObtenerAsync(int id, CancellationToken ct) =>
        ClienteDto.Desde(await ConDetalle().FirstOrDefaultAsync(c => c.Id == id, ct)
                         ?? throw new NoEncontradoException("Cliente", id));

    public async Task<ClienteDto> CrearAsync(GuardarClienteRequest req, CancellationToken ct)
    {
        await ValidarAsync(req, null, ct);
        var cliente = new Cliente();
        Aplicar(cliente, req);
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(cliente.Id, ct);
    }

    public async Task<ClienteDto> ActualizarAsync(int id, GuardarClienteRequest req, CancellationToken ct)
    {
        var cliente = await db.Clientes.Include(c => c.Contactos).Include(c => c.Direcciones)
                          .FirstOrDefaultAsync(c => c.Id == id, ct)
                      ?? throw new NoEncontradoException("Cliente", id);
        await ValidarAsync(req, id, ct);
        Aplicar(cliente, req);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(cliente.Id, ct);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var cliente = await db.Clientes.FirstOrDefaultAsync(c => c.Id == id, ct)
                      ?? throw new NoEncontradoException("Cliente", id);
        cliente.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    private async Task ValidarAsync(GuardarClienteRequest req, int? excluirId, CancellationToken ct)
    {
        if (req.ListaPreciosId is { } listaId && !await db.ListasPrecios.AnyAsync(l => l.Id == listaId, ct))
            throw new NoEncontradoException("Lista de precios", listaId);
        if (req.CondicionPagoId is { } condId && !await db.CondicionesPago.AnyAsync(x => x.Id == condId, ct))
            throw new NoEncontradoException("Condición de pago", condId);
        if (req.InstrumentoPagoId is { } instId && !await db.InstrumentosPago.AnyAsync(x => x.Id == instId, ct))
            throw new NoEncontradoException("Instrumento de pago", instId);

        var tipos = req.Contactos.Where(x => x.TipoContactoId != null).Select(x => x.TipoContactoId!.Value).Distinct().ToList();
        if (tipos.Count > 0 && await db.TiposContacto.CountAsync(t => tipos.Contains(t.Id), ct) != tipos.Count)
            throw new ReglaNegocioException("Uno de los contactos tiene un tipo de contacto que no existe.");

        if (req.Contactos.Count(x => x.Principal) > 1)
            throw new ReglaNegocioException("Solo puede haber un contacto principal.");
        if (req.Direcciones.Count(x => x.Principal) > 1)
            throw new ReglaNegocioException("Solo puede haber una dirección de entrega principal.");

        var diaInvalido = req.DiasRevision.FirstOrDefault(d => !GuardarClienteRequest.DiasSemana.Contains(d));
        if (diaInvalido != null)
            throw new ReglaNegocioException($"«{diaInvalido}» no es un día válido para el contrarecibo.");
        if (req.HoraRevisionDesde is { } desde && req.HoraRevisionHasta is { } hasta && hasta <= desde)
            throw new ReglaNegocioException("La hora final de revisión debe ser posterior a la inicial.");

        if (string.IsNullOrWhiteSpace(req.Rfc)) return;
        var normalizado = req.Rfc.Trim().ToUpper();
        if (await db.Clientes.AnyAsync(c => c.Rfc == normalizado && c.Id != excluirId, ct))
            throw new ReglaNegocioException($"Ya existe un cliente con el RFC {normalizado}.");
    }

    private static string? Limpio(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static void Aplicar(Cliente c, GuardarClienteRequest req)
    {
        c.RazonSocial = req.RazonSocial.Trim();
        c.NombreComercial = Limpio(req.NombreComercial);
        c.Rfc = Limpio(req.Rfc)?.ToUpper();
        c.TipoPersona = req.TipoPersona;
        c.Telefono = Limpio(req.Telefono);
        c.Correo = Limpio(req.Correo);
        c.Direccion = Limpio(req.Direccion);
        c.Zona = Limpio(req.Zona);
        c.ListaPreciosId = req.ListaPreciosId;
        c.CondicionPagoId = req.CondicionPagoId;
        c.InstrumentoPagoId = req.InstrumentoPagoId;
        c.Banco = Limpio(req.Banco);
        c.NumeroCuenta = Limpio(req.NumeroCuenta);
        c.Clabe = Limpio(req.Clabe);
        // Se guardan en el orden de la semana, sin repetidos.
        var dias = GuardarClienteRequest.DiasSemana.Where(req.DiasRevision.Contains).ToList();
        c.DiasRevision = dias.Count > 0 ? string.Join(",", dias) : null;
        c.HoraRevisionDesde = req.HoraRevisionDesde;
        c.HoraRevisionHasta = req.HoraRevisionHasta;
        c.InstruccionesContrarecibo = Limpio(req.InstruccionesContrarecibo);
        c.Notas = Limpio(req.Notas);
        c.Activo = req.Activo;

        c.Contactos.Clear();
        foreach (var x in req.Contactos)
        {
            c.Contactos.Add(new ContactoCliente
            {
                Nombre = x.Nombre.Trim(), Puesto = Limpio(x.Puesto), TipoContactoId = x.TipoContactoId,
                Telefono = Limpio(x.Telefono), Extension = Limpio(x.Extension), Celular = Limpio(x.Celular),
                Correo = Limpio(x.Correo),
                // Si nadie quedó marcado, el primero es el principal.
                Principal = x.Principal || (!req.Contactos.Any(y => y.Principal) && x == req.Contactos[0]),
            });
        }
        // El "contacto principal" del listado sale de los contactos cuando los hay.
        c.ContactoPrincipal = c.Contactos.FirstOrDefault(x => x.Principal)?.Nombre ?? Limpio(req.ContactoPrincipal);

        c.Direcciones.Clear();
        foreach (var x in req.Direcciones)
        {
            c.Direcciones.Add(new DireccionCliente
            {
                Nombre = x.Nombre.Trim(), Calle = x.Calle.Trim(), NumeroExterior = Limpio(x.NumeroExterior),
                NumeroInterior = Limpio(x.NumeroInterior), Colonia = Limpio(x.Colonia), CodigoPostal = Limpio(x.CodigoPostal),
                Municipio = Limpio(x.Municipio), Estado = Limpio(x.Estado), Pais = Limpio(x.Pais) ?? "México",
                Instrucciones = Limpio(x.Instrucciones),
                Principal = x.Principal || (!req.Direcciones.Any(y => y.Principal) && x == req.Direcciones[0]),
            });
        }
    }
}
