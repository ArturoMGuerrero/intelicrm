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
            ContactoPrincipal = prospecto.NombreCompleto,
            Telefono = prospecto.Telefono,
            Correo = prospecto.Correo
        };

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

        var entrada = new BitacoraEntrada
        {
            ProspectoId = prospectoId,
            Fecha = req.Fecha ?? DateTime.Now,
            Descripcion = req.Descripcion.Trim(),
            EmpleadoId = req.EmpleadoId,
            AccionActividadId = req.AccionActividadId
        };
        db.Bitacora.Add(entrada);
        await db.SaveChangesAsync(ct);

        var guardada = await db.Bitacora.AsNoTracking()
            .Include(b => b.Empleado).Include(b => b.AccionActividad)
            .FirstAsync(b => b.Id == entrada.Id, ct);
        return BitacoraDto.Desde(guardada);
    }

    // ---------- Auxiliares ----------

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
        p.Nombre = req.Nombre.Trim();
        p.Apellidos = req.Apellidos.Trim();
        p.Empresa = req.Empresa?.Trim();
        p.Cargo = req.Cargo?.Trim();
        p.Telefono = req.Telefono?.Trim();
        p.Correo = req.Correo?.Trim();
        p.Origen = req.Origen?.Trim();
        p.Etapa = req.Etapa;
        p.ValorEstimado = req.ValorEstimado;
        p.Notas = req.Notas?.Trim();
        p.EmpleadoResponsableId = req.EmpleadoResponsableId;
        p.UnidadNegocioId = req.UnidadNegocioId;
        p.Activo = req.Activo;
    }
}
