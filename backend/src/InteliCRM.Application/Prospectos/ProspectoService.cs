using InteliCRM.Application.Clientes;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Prospectos;

public class ProspectoService(IAppDbContext db)
{
    public async Task<List<ProspectoDto>> ListarAsync(
        string? buscar, EtapaProspecto? etapa, int? empleadoId, bool incluirInactivos, CancellationToken ct)
    {
        var query = Consulta().Where(p => incluirInactivos || p.Activo);

        if (etapa is not null)
            query = query.Where(p => p.Etapa == etapa);

        if (empleadoId is not null)
            query = query.Where(p => p.EmpleadoResponsableId == empleadoId);

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var texto = buscar.Trim().ToLower();
            query = query.Where(p =>
                (p.Nombre + " " + p.Apellidos).ToLower().Contains(texto) ||
                (p.Empresa != null && p.Empresa.ToLower().Contains(texto)) ||
                (p.Correo != null && p.Correo.ToLower().Contains(texto)) ||
                (p.Telefono != null && p.Telefono.Contains(texto)));
        }

        var prospectos = await query.OrderByDescending(p => p.FechaCreacion).ToListAsync(ct);
        return prospectos.Select(ProspectoDto.Desde).ToList();
    }

    public async Task<ProspectoDto> ObtenerAsync(int id, CancellationToken ct) =>
        ProspectoDto.Desde(await Consulta().FirstOrDefaultAsync(p => p.Id == id, ct)
                           ?? throw new NoEncontradoException("Prospecto", id));

    public async Task<ProspectoDto> CrearAsync(GuardarProspectoRequest req, CancellationToken ct)
    {
        await ValidarReferenciasAsync(req.EmpleadoResponsableId, req.UnidadNegocioId, ct);
        var prospecto = new Prospecto();
        Aplicar(prospecto, req);
        db.Prospectos.Add(prospecto);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(prospecto.Id, ct);
    }

    public async Task<ProspectoDto> ActualizarAsync(int id, GuardarProspectoRequest req, CancellationToken ct)
    {
        var prospecto = await BuscarAsync(id, ct);
        await ValidarReferenciasAsync(req.EmpleadoResponsableId, req.UnidadNegocioId, ct);
        Aplicar(prospecto, req);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<ProspectoDto> CambiarEtapaAsync(int id, EtapaProspecto etapa, CancellationToken ct)
    {
        var prospecto = await BuscarAsync(id, ct);
        if (prospecto.Etapa != etapa)
        {
            db.Bitacora.Add(new BitacoraEntrada
            {
                ProspectoId = id,
                Fecha = DateTime.Now,
                Descripcion = $"Etapa cambiada de {prospecto.Etapa} a {etapa}."
            });
            prospecto.Etapa = etapa;
            await db.SaveChangesAsync(ct);
        }
        return await ObtenerAsync(id, ct);
    }

    /// <summary>
    /// Crea un cliente a partir del prospecto y lo marca como Ganado.
    /// Si ya se había convertido, regresa el cliente existente.
    /// </summary>
    public async Task<ClienteDto> ConvertirEnClienteAsync(int id, CancellationToken ct)
    {
        var prospecto = await db.Prospectos.Include(p => p.Cliente).FirstOrDefaultAsync(p => p.Id == id, ct)
                        ?? throw new NoEncontradoException("Prospecto", id);

        if (prospecto.Cliente is not null)
            return ClienteDto.Desde(prospecto.Cliente);

        var cliente = new Cliente
        {
            RazonSocial = string.IsNullOrWhiteSpace(prospecto.Empresa) ? prospecto.NombreCompleto : prospecto.Empresa,
            TipoPersona = string.IsNullOrWhiteSpace(prospecto.Empresa) ? TipoPersona.Fisica : TipoPersona.Moral,
            Rfc = prospecto.Rfc,
            ContactoPrincipal = prospecto.NombreCompleto,
            Telefono = prospecto.Telefono,
            Correo = prospecto.Correo,
            Direccion = DomicilioEnTexto(prospecto),
        };
        cliente.Contactos.Add(new ContactoCliente
        {
            Nombre = prospecto.NombreCompleto, Puesto = prospecto.Cargo, Telefono = prospecto.Telefono,
            Correo = prospecto.Correo, Principal = true,
        });
        // El RFC es único por cuenta: si otro cliente ya lo tiene, se deja vacío en lugar de fallar.
        if (cliente.Rfc != null && await db.Clientes.AnyAsync(c => c.Rfc == cliente.Rfc, ct))
            cliente.Rfc = null;

        prospecto.Cliente = cliente;
        prospecto.Etapa = EtapaProspecto.Ganado;
        db.Bitacora.Add(new BitacoraEntrada
        {
            ProspectoId = id,
            Fecha = DateTime.Now,
            Descripcion = $"Prospecto convertido en cliente: {cliente.RazonSocial}."
        });

        await db.SaveChangesAsync(ct);
        return ClienteDto.Desde(cliente);
    }

    public async Task DesactivarAsync(int id, CancellationToken ct)
    {
        var prospecto = await BuscarAsync(id, ct);
        prospecto.Activo = false;
        await db.SaveChangesAsync(ct);
    }

    // ---------- Bitácora ----------

    public async Task<List<BitacoraDto>> ListarBitacoraAsync(int prospectoId, CancellationToken ct)
    {
        await BuscarAsync(prospectoId, ct);
        var entradas = await db.Bitacora.AsNoTracking()
            .Include(b => b.Empleado).Include(b => b.AccionActividad)
            .Where(b => b.ProspectoId == prospectoId)
            .OrderByDescending(b => b.Fecha)
            .ToListAsync(ct);

        return entradas.Select(BitacoraDto.Desde).ToList();
    }

    public async Task<BitacoraDto> AgregarBitacoraAsync(int prospectoId, AgregarBitacoraRequest req, CancellationToken ct)
    {
        await BuscarAsync(prospectoId, ct);
        if (req.EmpleadoId is { } empleadoId && !await db.Empleados.AnyAsync(e => e.Id == empleadoId, ct))
            throw new NoEncontradoException("Empleado", empleadoId);
        if (req.AccionActividadId is { } accionId && !await db.AccionesActividades.AnyAsync(a => a.Id == accionId, ct))
            throw new NoEncontradoException("Acción/actividad", accionId);
        if (req.FechaAviso is { } aviso && aviso < (req.Fecha ?? DateTime.Now).Date)
            throw new ReglaNegocioException("La fecha de aviso no puede ser anterior a la de la entrada.");

        var entrada = new BitacoraEntrada
        {
            ProspectoId = prospectoId,
            Fecha = req.Fecha ?? DateTime.Now,
            Descripcion = req.Descripcion.Trim(),
            EmpleadoId = req.EmpleadoId,
            AccionActividadId = req.AccionActividadId,
            FechaAviso = req.FechaAviso,
        };
        db.Bitacora.Add(entrada);
        await db.SaveChangesAsync(ct);

        var guardada = await db.Bitacora.AsNoTracking()
            .Include(b => b.Empleado).Include(b => b.AccionActividad)
            .FirstAsync(b => b.Id == entrada.Id, ct);
        return BitacoraDto.Desde(guardada);
    }

    // ---------- Seguimiento ----------

    /// <summary>Avisos de seguimiento sin atender (vencidos, de hoy y próximos).</summary>
    public async Task<List<BitacoraDto>> AvisosAsync(int? empleadoId, CancellationToken ct)
    {
        var avisos = await db.Bitacora.AsNoTracking()
            .Include(b => b.Prospecto).Include(b => b.Empleado).Include(b => b.AccionActividad)
            .Where(b => b.FechaAviso != null && !b.AvisoAtendido && b.Prospecto!.Activo)
            .Where(b => empleadoId == null || b.EmpleadoId == empleadoId || b.Prospecto!.EmpleadoResponsableId == empleadoId)
            .OrderBy(b => b.FechaAviso)
            .ToListAsync(ct);
        return avisos.Select(BitacoraDto.Desde).ToList();
    }

    public async Task<BitacoraDto> AtenderAvisoAsync(int bitacoraId, CancellationToken ct)
    {
        var entrada = await db.Bitacora.Include(b => b.Prospecto).Include(b => b.Empleado).Include(b => b.AccionActividad)
                          .FirstOrDefaultAsync(b => b.Id == bitacoraId, ct)
                      ?? throw new NoEncontradoException("Entrada de bitácora", bitacoraId);
        if (entrada.FechaAviso is null)
            throw new ReglaNegocioException("Esta entrada no tiene aviso.");
        entrada.AvisoAtendido = true;
        await db.SaveChangesAsync(ct);
        return BitacoraDto.Desde(entrada);
    }

    /// <summary>Bitácora de todos los prospectos en un día (antes "Bitácora del día").</summary>
    public async Task<List<BitacoraDto>> BitacoraDelDiaAsync(DateOnly fecha, int? empleadoId, CancellationToken ct)
    {
        var inicio = fecha.ToDateTime(TimeOnly.MinValue);
        var entradas = await db.Bitacora.AsNoTracking()
            .Include(b => b.Prospecto).Include(b => b.Empleado).Include(b => b.AccionActividad)
            .Where(b => b.Fecha >= inicio && b.Fecha < inicio.AddDays(1))
            .Where(b => empleadoId == null || b.EmpleadoId == empleadoId)
            .OrderByDescending(b => b.Fecha)
            .ToListAsync(ct);
        return entradas.Select(BitacoraDto.Desde).ToList();
    }

    /// <summary>
    /// Prospectos en seguimiento (no ganados ni perdidos) sin entradas de bitácora en los últimos
    /// <paramref name="dias"/> días o sin ninguna (antes "Prospectos sin bitácora").
    /// </summary>
    public async Task<List<ProspectoSinSeguimientoDto>> SinSeguimientoAsync(int dias, int? empleadoId, CancellationToken ct)
    {
        var limite = DateTime.Now.AddDays(-dias);
        var prospectos = await db.Prospectos.AsNoTracking()
            .Where(p => p.Activo && p.Etapa != EtapaProspecto.Ganado && p.Etapa != EtapaProspecto.Perdido)
            .Where(p => empleadoId == null || p.EmpleadoResponsableId == empleadoId)
            .Select(p => new
            {
                p.Id, p.Nombre, p.Apellidos, p.Empresa, p.Etapa, p.FechaCreacion,
                Responsable = p.EmpleadoResponsable != null ? p.EmpleadoResponsable.Nombre + " " + p.EmpleadoResponsable.Apellidos : null,
                Ultima = p.Bitacora.Max(b => (DateTime?)b.Fecha),
            })
            .ToListAsync(ct);

        return prospectos
            .Where(p => (p.Ultima ?? p.FechaCreacion) < limite)
            .Select(p => new ProspectoSinSeguimientoDto(p.Id, $"{p.Nombre} {p.Apellidos}".Trim(), p.Empresa, p.Etapa,
                p.Responsable, p.Ultima, (int)(DateTime.Now - (p.Ultima ?? p.FechaCreacion)).TotalDays))
            .OrderByDescending(p => p.DiasSinSeguimiento)
            .ToList();
    }

    // ---------- Auxiliares ----------

    private static string? DomicilioEnTexto(Prospecto p)
    {
        var partes = new[] { p.Calle, p.Colonia, p.CodigoPostal is null ? null : $"C.P. {p.CodigoPostal}", p.Ciudad, p.Estado }
            .Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
        return partes.Count > 0 ? string.Join(", ", partes) : null;
    }

    private IQueryable<Prospecto> Consulta() =>
        db.Prospectos.AsNoTracking().Include(p => p.EmpleadoResponsable).Include(p => p.UnidadNegocio);

    private async Task<Prospecto> BuscarAsync(int id, CancellationToken ct) =>
        await db.Prospectos.FirstOrDefaultAsync(p => p.Id == id, ct)
        ?? throw new NoEncontradoException("Prospecto", id);

    private async Task ValidarReferenciasAsync(int? empleadoId, int? unidadId, CancellationToken ct)
    {
        if (empleadoId is { } e && !await db.Empleados.AnyAsync(x => x.Id == e, ct))
            throw new NoEncontradoException("Empleado", e);
        if (unidadId is { } u && !await db.UnidadesNegocio.AnyAsync(x => x.Id == u, ct))
            throw new NoEncontradoException("Unidad de negocio", u);
    }

    private static void Aplicar(Prospecto p, GuardarProspectoRequest req)
    {
        if (req.FechaNacimiento is { } nacimiento && nacimiento > DateOnly.FromDateTime(DateTime.Today))
            throw new ReglaNegocioException("La fecha de nacimiento no puede ser futura.");
        p.Nombre = req.Nombre.Trim();
        p.Apellidos = req.Apellidos.Trim();
        p.Empresa = req.Empresa?.Trim();
        p.Cargo = req.Cargo?.Trim();
        p.Telefono = req.Telefono?.Trim();
        p.Correo = req.Correo?.Trim();
        p.Origen = req.Origen?.Trim();
        p.Rfc = string.IsNullOrWhiteSpace(req.Rfc) ? null : req.Rfc.Trim().ToUpper();
        p.FechaNacimiento = req.FechaNacimiento;
        p.Calle = string.IsNullOrWhiteSpace(req.Calle) ? null : req.Calle.Trim();
        p.Colonia = string.IsNullOrWhiteSpace(req.Colonia) ? null : req.Colonia.Trim();
        p.CodigoPostal = string.IsNullOrWhiteSpace(req.CodigoPostal) ? null : req.CodigoPostal.Trim();
        p.Ciudad = string.IsNullOrWhiteSpace(req.Ciudad) ? null : req.Ciudad.Trim();
        p.Estado = string.IsNullOrWhiteSpace(req.Estado) ? null : req.Estado.Trim();
        p.Etapa = req.Etapa;
        p.ValorEstimado = req.ValorEstimado;
        p.Notas = req.Notas?.Trim();
        p.EmpleadoResponsableId = req.EmpleadoResponsableId;
        p.UnidadNegocioId = req.UnidadNegocioId;
        p.Activo = req.Activo;
    }
}
