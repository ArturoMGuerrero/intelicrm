using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Application.Cotizaciones;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Cobranza;

public record CargoResumenDto(
    int Id, string Folio, DateOnly Fecha, DateOnly FechaVencimiento, int DiasCredito,
    int? ProspectoId, int? ClienteId, string Destinatario, string? Cotizacion,
    decimal Total, decimal Pagado, decimal Saldo, EstadoSaldo Estado, int DiasVencido)
{
    public static CargoResumenDto Desde(Cargo c, DateOnly hoy) => new(
        c.Id, c.Folio, c.Fecha, c.FechaVencimiento, c.DiasCredito,
        c.ProspectoId, c.ClienteId, CargoService.NombreDestinatario(c), c.Cotizacion?.Folio,
        c.Total, c.Pagado, c.Saldo, c.Estado(hoy), c.DiasVencido(hoy));
}

public record CargoDto(
    int Id, string Folio, DateOnly Fecha, DateOnly FechaVencimiento, int DiasCredito,
    int? CondicionPagoId, string? CondicionPago,
    int? ProspectoId, int? ClienteId, string Destinatario,
    int? EmpleadoId, string? Empleado, int? CotizacionId, string? Cotizacion,
    string? Notas, EstatusDocumento Estatus, string? MotivoCancelacion,
    decimal Subtotal, decimal Iva, decimal Total, decimal Pagado, decimal Saldo,
    EstadoSaldo Estado, int DiasVencido,
    List<PartidaDto> Partidas, List<PagoDto> Pagos)
{
    public static CargoDto Desde(Cargo c, DateOnly hoy) => new(
        c.Id, c.Folio, c.Fecha, c.FechaVencimiento, c.DiasCredito,
        c.CondicionPagoId, c.CondicionPago?.Nombre,
        c.ProspectoId, c.ClienteId, CargoService.NombreDestinatario(c),
        c.EmpleadoId, c.Empleado?.NombreCompleto, c.CotizacionId, c.Cotizacion?.Folio,
        c.Notas, c.Estatus, c.MotivoCancelacion,
        c.Subtotal, c.Iva, c.Total, c.Pagado, c.Saldo, c.Estado(hoy), c.DiasVencido(hoy),
        c.Partidas.OrderBy(p => p.Id)
            .Select(p => new PartidaDto(p.Id, p.ProductoId, p.Descripcion, p.Cantidad, p.PrecioUnitario, p.DescuentoPorcentaje, p.Importe))
            .ToList(),
        c.Pagos.OrderBy(p => p.Fecha).ThenBy(p => p.Id).Select(PagoDto.Desde).ToList());
}

public class CrearCargoRequest
{
    public int? ProspectoId { get; set; }
    public int? ClienteId { get; set; }
    public int? EmpleadoId { get; set; }

    /// <summary>Si no se indica, se usa la fecha de hoy.</summary>
    public DateOnly? Fecha { get; set; }

    public int? CondicionPagoId { get; set; }

    /// <summary>Si no se indica, se toman de la condición de pago (o contado).</summary>
    [Range(0, 365)]
    public int? DiasCredito { get; set; }

    [StringLength(2000)]
    public string? Notas { get; set; }

    [MinLength(1, ErrorMessage = "El cargo debe tener al menos una partida.")]
    public List<GuardarPartidaRequest> Partidas { get; set; } = [];
}

public class CargoDesdeCotizacionRequest
{
    public DateOnly? Fecha { get; set; }
    public int? CondicionPagoId { get; set; }

    [Range(0, 365)]
    public int? DiasCredito { get; set; }
}

public class FiltroCargos
{
    public string? Buscar { get; set; }
    public FiltroEstadoSaldo Estado { get; set; } = FiltroEstadoSaldo.Todos;
    public int? ClienteId { get; set; }
    public int? ProspectoId { get; set; }
}

/// <summary>
/// Cargos a clientes y prospectos (antes "Cargos a prospectos" / "Remisión") y su cobranza.
/// Un cargo no se edita: si está mal se cancela (sin pagos) y se hace otro.
/// </summary>
public class CargoService(IAppDbContext db)
{
    public async Task<List<CargoResumenDto>> ListarAsync(FiltroCargos filtro, CancellationToken ct)
    {
        var query = Consulta(conDetalle: false).AsNoTracking();
        if (filtro.ClienteId is { } clienteId) query = query.Where(c => c.ClienteId == clienteId);
        if (filtro.ProspectoId is { } prospectoId) query = query.Where(c => c.ProspectoId == prospectoId);

        if (!string.IsNullOrWhiteSpace(filtro.Buscar))
        {
            var texto = filtro.Buscar.Trim().ToLower();
            query = query.Where(c =>
                c.Folio.ToLower().Contains(texto) ||
                (c.Cliente != null && c.Cliente.RazonSocial.ToLower().Contains(texto)) ||
                (c.Prospecto != null && (c.Prospecto.Nombre + " " + c.Prospecto.Apellidos).ToLower().Contains(texto)) ||
                (c.Prospecto != null && c.Prospecto.Empresa != null && c.Prospecto.Empresa.ToLower().Contains(texto)));
        }

        var hoy = Saldos.Hoy;
        var cargos = await query.OrderByDescending(c => c.Fecha).ThenByDescending(c => c.Id).ToListAsync(ct);
        return cargos.Where(c => Saldos.Cumple(c, filtro.Estado, hoy)).Select(c => CargoResumenDto.Desde(c, hoy)).ToList();
    }

    public async Task<CargoDto> ObtenerAsync(int id, CancellationToken ct) =>
        CargoDto.Desde(await Consulta(conDetalle: true).AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct)
                       ?? throw new NoEncontradoException("Cargo", id), Saldos.Hoy);

    public async Task<ResumenSaldosDto> ResumenAsync(CancellationToken ct)
    {
        var cargos = await db.Cargos.AsNoTracking().Where(c => c.Estatus == EstatusDocumento.Vigente).ToListAsync(ct);
        var inicioMes = new DateOnly(Saldos.Hoy.Year, Saldos.Hoy.Month, 1);
        var pagosMes = await db.PagosCargo.AsNoTracking().Where(p => p.Fecha >= inicioMes && !p.Cancelado).ToListAsync(ct);
        return Saldos.Resumir(cargos, pagosMes);
    }

    public async Task<CargoDto> CrearAsync(CrearCargoRequest req, CancellationToken ct)
    {
        if (req.ProspectoId is null && req.ClienteId is null)
            throw new ReglaNegocioException("El cargo debe hacerse a un prospecto o a un cliente.");
        if (req.ProspectoId is { } pId && !await db.Prospectos.AnyAsync(p => p.Id == pId, ct))
            throw new NoEncontradoException("Prospecto", pId);
        if (req.ClienteId is { } cId && !await db.Clientes.AnyAsync(c => c.Id == cId, ct))
            throw new NoEncontradoException("Cliente", cId);
        if (req.EmpleadoId is { } eId && !await db.Empleados.AnyAsync(e => e.Id == eId, ct))
            throw new NoEncontradoException("Empleado", eId);

        var partidas = await Partidas.ValidarAsync(db, req.Partidas, ct);
        var dias = await Saldos.DiasCreditoAsync(db, req.CondicionPagoId, req.DiasCredito, ct);

        var cargo = await NuevoCargoAsync(ct);
        cargo.ProspectoId = req.ProspectoId;
        cargo.ClienteId = req.ClienteId;
        cargo.EmpleadoId = req.EmpleadoId;
        cargo.CondicionPagoId = req.CondicionPagoId;
        cargo.Notas = req.Notas?.Trim();
        cargo.FijarPlazo(req.Fecha ?? Saldos.Hoy, dias);
        foreach (var p in partidas)
            cargo.Partidas.Add(new CargoPartida
            {
                ProductoId = p.ProductoId, Descripcion = p.Descripcion, Cantidad = p.Cantidad,
                PrecioUnitario = p.PrecioUnitario, DescuentoPorcentaje = p.DescuentoPorcentaje,
            });
        cargo.RecalcularTotales();

        return await GuardarNuevoAsync(cargo, ct);
    }

    /// <summary>Genera el cargo de una cotización aceptada copiando sus partidas.</summary>
    public async Task<CargoDto> CrearDesdeCotizacionAsync(int cotizacionId, CargoDesdeCotizacionRequest req, CancellationToken ct)
    {
        var cotizacion = await db.Cotizaciones.AsNoTracking().Include(c => c.Partidas)
                             .FirstOrDefaultAsync(c => c.Id == cotizacionId, ct)
                         ?? throw new NoEncontradoException("Cotización", cotizacionId);

        if (cotizacion.Estatus != EstatusCotizacion.Aceptada)
            throw new ReglaNegocioException("Solo se pueden cargar cotizaciones aceptadas.");

        var existente = await db.Cargos.AsNoTracking()
            .Where(c => c.CotizacionId == cotizacionId && c.Estatus == EstatusDocumento.Vigente)
            .Select(c => c.Folio).FirstOrDefaultAsync(ct);
        if (existente is not null)
            throw new ReglaNegocioException($"La cotización {cotizacion.Folio} ya tiene el cargo {existente}.");

        var dias = await Saldos.DiasCreditoAsync(db, req.CondicionPagoId, req.DiasCredito, ct);

        var cargo = await NuevoCargoAsync(ct);
        cargo.CotizacionId = cotizacion.Id;
        cargo.ProspectoId = cotizacion.ProspectoId;
        cargo.ClienteId = cotizacion.ClienteId;
        cargo.EmpleadoId = cotizacion.EmpleadoId;
        cargo.CondicionPagoId = req.CondicionPagoId;
        cargo.Notas = $"Generado de la cotización {cotizacion.Folio}.";
        cargo.FijarPlazo(req.Fecha ?? Saldos.Hoy, dias);
        foreach (var p in cotizacion.Partidas.OrderBy(p => p.Id))
            cargo.Partidas.Add(new CargoPartida
            {
                ProductoId = p.ProductoId, Descripcion = p.Descripcion, Cantidad = p.Cantidad,
                PrecioUnitario = p.PrecioUnitario, DescuentoPorcentaje = p.DescuentoPorcentaje,
            });
        cargo.RecalcularTotales();

        return await GuardarNuevoAsync(cargo, ct);
    }

    public async Task<CargoDto> CancelarAsync(int id, string motivo, CancellationToken ct)
    {
        var cargo = await BuscarConPagosAsync(id, ct);
        Saldos.CancelarDocumento(cargo, cargo.Pagos, motivo);
        AnotarEnBitacora(cargo, $"Cargo {cargo.Folio} cancelado: {motivo.Trim()}");
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<CargoDto> RegistrarPagoAsync(int id, RegistrarPagoRequest req, CancellationToken ct)
    {
        var cargo = await BuscarConPagosAsync(id, ct);
        var pago = await Saldos.NuevoPagoAsync<PagoCargo>(db, cargo, req, ct);
        cargo.Pagos.Add(pago);
        cargo.RecalcularSaldo();

        AnotarEnBitacora(cargo, cargo.Saldo == 0
            ? $"Pago de {Formato.Moneda(pago.Monto)} al cargo {cargo.Folio}. Cargo liquidado."
            : $"Pago de {Formato.Moneda(pago.Monto)} al cargo {cargo.Folio}. Saldo: {Formato.Moneda(cargo.Saldo)}.");

        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    public async Task<CargoDto> CancelarPagoAsync(int id, int pagoId, CancellationToken ct)
    {
        var cargo = await BuscarConPagosAsync(id, ct);
        Saldos.CancelarPago(cargo, cargo.Pagos.FirstOrDefault(p => p.Id == pagoId), pagoId);
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(id, ct);
    }

    internal static string NombreDestinatario(Cargo c) =>
        c.Cliente?.RazonSocial
        ?? (c.Prospecto is null ? "" :
            string.IsNullOrWhiteSpace(c.Prospecto.Empresa)
                ? c.Prospecto.NombreCompleto
                : $"{c.Prospecto.NombreCompleto} ({c.Prospecto.Empresa})");

    private IQueryable<Cargo> Consulta(bool conDetalle)
    {
        var q = db.Cargos.Include(c => c.Prospecto).Include(c => c.Cliente).Include(c => c.Cotizacion);
        return conDetalle
            ? q.Include(c => c.Empleado).Include(c => c.CondicionPago).Include(c => c.Partidas)
               .Include(c => c.Pagos).ThenInclude(p => p.InstrumentoPago)
            : q;
    }

    private async Task<Cargo> BuscarConPagosAsync(int id, CancellationToken ct) =>
        await db.Cargos.Include(c => c.Pagos).FirstOrDefaultAsync(c => c.Id == id, ct)
        ?? throw new NoEncontradoException("Cargo", id);

    private async Task<Cargo> NuevoCargoAsync(CancellationToken ct)
    {
        // Consecutivo por cuenta; el índice único (CuentaId, Consecutivo) evita duplicados simultáneos.
        var consecutivo = (await db.Cargos.MaxAsync(c => (int?)c.Consecutivo, ct) ?? 0) + 1;
        return new Cargo { Consecutivo = consecutivo, Folio = $"CAR-{consecutivo:D5}" };
    }

    private async Task<CargoDto> GuardarNuevoAsync(Cargo cargo, CancellationToken ct)
    {
        db.Cargos.Add(cargo);
        AnotarEnBitacora(cargo, $"Se generó el cargo {cargo.Folio} por {Formato.Moneda(cargo.Total)}.");
        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(cargo.Id, ct);
    }

    private void AnotarEnBitacora(Cargo cargo, string descripcion)
    {
        if (cargo.ProspectoId is { } prospectoId)
            db.Bitacora.Add(new BitacoraEntrada { ProspectoId = prospectoId, Fecha = DateTime.Now, Descripcion = descripcion });
    }
}
