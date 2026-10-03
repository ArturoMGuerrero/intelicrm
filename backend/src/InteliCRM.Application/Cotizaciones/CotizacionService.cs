using InteliCRM.Application.Common;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Cotizaciones;

public class CotizacionService(IAppDbContext db)
{
    private static readonly EstatusCotizacion[] EstatusEditables = [EstatusCotizacion.Borrador, EstatusCotizacion.Enviada];

    public async Task<List<CotizacionResumenDto>> ListarAsync(
        EstatusCotizacion? estatus, int? prospectoId, int? clienteId, CancellationToken ct)
    {
        var query = db.Cotizaciones.AsNoTracking()
            .Include(c => c.Prospecto).Include(c => c.Cliente).Include(c => c.Empleado)
            .AsQueryable();

        if (estatus is not null) query = query.Where(c => c.Estatus == estatus);
        if (prospectoId is not null) query = query.Where(c => c.ProspectoId == prospectoId);
        if (clienteId is not null) query = query.Where(c => c.ClienteId == clienteId);

        var cotizaciones = await query.OrderByDescending(c => c.Fecha).ThenByDescending(c => c.Id).ToListAsync(ct);
        return cotizaciones.Select(CotizacionResumenDto.Desde).ToList();
    }

    public async Task<CotizacionDto> ObtenerAsync(int id, CancellationToken ct) =>
        CotizacionDto.Desde(await Consulta().AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)
                            ?? throw new NoEncontradoException("Cotización", id));

    public async Task<CotizacionDto> CrearAsync(GuardarCotizacionRequest req, CancellationToken ct)
    {
        // Consecutivo por cuenta (la consulta ya está filtrada por la empresa del usuario).
        // Si dos usuarios crean al mismo tiempo, el índice único (CuentaId, Consecutivo) evita el duplicado.
        var consecutivo = (await db.Cotizaciones.MaxAsync(c => (int?)c.Consecutivo, ct) ?? 0) + 1;
        var cotizacion = new Cotizacion { Consecutivo = consecutivo, Folio = $"COT-{consecutivo:D5}" };

        await AplicarAsync(cotizacion, req, ct);
        db.Cotizaciones.Add(cotizacion);
        await db.SaveChangesAsync(ct);

        return await ObtenerAsync(cotizacion.Id, ct);
    }

    public async Task<CotizacionDto> ActualizarAsync(int id, GuardarCotizacionRequest req, CancellationToken ct)
    {
        var cotizacion = await Consulta().FirstOrDefaultAsync(c => c.Id == id, ct)
                         ?? throw new NoEncontradoException("Cotización", id);

        if (!EstatusEditables.Contains(cotizacion.Estatus))
            throw new ReglaNegocioException($"No se puede modificar una cotización en estatus {cotizacion.Estatus}.");

        await AplicarAsync(cotizacion, req, ct);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<CotizacionDto> CambiarEstatusAsync(int id, EstatusCotizacion estatus, CancellationToken ct)
    {
        var cotizacion = await db.Cotizaciones.FirstOrDefaultAsync(c => c.Id == id, ct)
                         ?? throw new NoEncontradoException("Cotización", id);

        cotizacion.Estatus = estatus;

        // Registrar en la bitácora del prospecto los cambios relevantes.
        if (cotizacion.ProspectoId is { } prospectoId)
        {
            db.Bitacora.Add(new BitacoraEntrada
            {
                ProspectoId = prospectoId,
                Fecha = DateTime.Now,
                Descripcion = $"Cotización {cotizacion.Folio} marcada como {estatus}."
            });
        }

        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task EliminarAsync(int id, CancellationToken ct)
    {
        var cotizacion = await Consulta().FirstOrDefaultAsync(c => c.Id == id, ct)
                         ?? throw new NoEncontradoException("Cotización", id);

        if (cotizacion.Estatus != EstatusCotizacion.Borrador)
            throw new ReglaNegocioException("Solo se pueden eliminar cotizaciones en borrador.");

        db.Cotizaciones.Remove(cotizacion);
        await db.SaveChangesAsync(ct);
    }

    private IQueryable<Cotizacion> Consulta() =>
        db.Cotizaciones
            .Include(c => c.Prospecto).Include(c => c.Cliente).Include(c => c.Empleado)
            .Include(c => c.Partidas);

    private async Task AplicarAsync(Cotizacion cotizacion, GuardarCotizacionRequest req, CancellationToken ct)
    {
        if (req.ProspectoId is null && req.ClienteId is null)
            throw new ReglaNegocioException("La cotización debe dirigirse a un prospecto o a un cliente.");

        if (req.ProspectoId is { } pId && !await db.Prospectos.AnyAsync(p => p.Id == pId, ct))
            throw new NoEncontradoException("Prospecto", pId);
        if (req.ClienteId is { } cId && !await db.Clientes.AnyAsync(c => c.Id == cId, ct))
            throw new NoEncontradoException("Cliente", cId);
        if (req.EmpleadoId is { } eId && !await db.Empleados.AnyAsync(e => e.Id == eId, ct))
            throw new NoEncontradoException("Empleado", eId);

        var nuevasPartidas = (await Partidas.ValidarAsync(db, req.Partidas, ct))
            .Select(p => new CotizacionPartida
            {
                ProductoId = p.ProductoId,
                Descripcion = p.Descripcion,
                Cantidad = p.Cantidad,
                PrecioUnitario = p.PrecioUnitario,
                DescuentoPorcentaje = p.DescuentoPorcentaje
            })
            .ToList();

        cotizacion.ProspectoId = req.ProspectoId;
        cotizacion.ClienteId = req.ClienteId;
        cotizacion.EmpleadoId = req.EmpleadoId;
        cotizacion.Fecha = req.Fecha ?? DateOnly.FromDateTime(DateTime.Today);
        cotizacion.VigenciaDias = req.VigenciaDias;
        cotizacion.Notas = req.Notas?.Trim();

        // Las partidas se reemplazan completas en cada guardado.
        cotizacion.Partidas.Clear();
        foreach (var p in nuevasPartidas)
            cotizacion.Partidas.Add(p);

        cotizacion.RecalcularTotales();
    }
}
