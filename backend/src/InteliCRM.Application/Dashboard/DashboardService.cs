using InteliCRM.Application.Citas;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Dashboard;

public record EtapaResumenDto(EtapaProspecto Etapa, int Cantidad, decimal ValorEstimado);

public record DashboardDto(
    int ProspectosActivos,
    int ClientesActivos,
    int CitasHoy,
    int CotizacionesAbiertas,
    decimal MontoCotizacionesAbiertas,
    decimal MontoGanadoMes,
    List<EtapaResumenDto> Embudo,
    List<CitaDto> ProximasCitas);

public class DashboardService(IAppDbContext db, CitaService citas)
{
    public async Task<DashboardDto> ObtenerAsync(CancellationToken ct)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        var inicioHoy = DateTime.Today;
        var inicioMes = new DateOnly(hoy.Year, hoy.Month, 1);

        var prospectos = await db.Prospectos.AsNoTracking()
            .Where(p => p.Activo)
            .Select(p => new { p.Etapa, p.ValorEstimado })
            .ToListAsync(ct);

        var embudo = Enum.GetValues<EtapaProspecto>()
            .Select(etapa => new EtapaResumenDto(
                etapa,
                prospectos.Count(p => p.Etapa == etapa),
                prospectos.Where(p => p.Etapa == etapa).Sum(p => p.ValorEstimado ?? 0)))
            .ToList();

        var abiertas = await db.Cotizaciones.AsNoTracking()
            .Where(c => c.Estatus == EstatusCotizacion.Borrador || c.Estatus == EstatusCotizacion.Enviada)
            .Select(c => c.Total)
            .ToListAsync(ct);

        var ganadoMes = await db.Cotizaciones.AsNoTracking()
            .Where(c => c.Estatus == EstatusCotizacion.Aceptada && c.Fecha >= inicioMes)
            .SumAsync(c => c.Total, ct);

        var proximas = (await citas.ListarAsync(hoy, hoy.AddDays(7), null, null, ct))
            .Where(c => c.FechaHoraFin >= DateTime.Now
                        && c.Estatus is EstatusCita.Programada or EstatusCita.Confirmada)
            .Take(8)
            .ToList();

        return new DashboardDto(
            ProspectosActivos: prospectos.Count(p => p.Etapa is not (EtapaProspecto.Ganado or EtapaProspecto.Perdido)),
            ClientesActivos: await db.Clientes.CountAsync(c => c.Activo, ct),
            CitasHoy: await db.Citas.CountAsync(c => c.FechaHoraInicio >= inicioHoy
                                                     && c.FechaHoraInicio < inicioHoy.AddDays(1)
                                                     && c.Estatus != EstatusCita.Cancelada, ct),
            CotizacionesAbiertas: abiertas.Count,
            MontoCotizacionesAbiertas: abiertas.Sum(),
            MontoGanadoMes: ganadoMes,
            Embudo: embudo,
            ProximasCitas: proximas);
    }
}
