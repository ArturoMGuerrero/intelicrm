using InteliCRM.Application.Common;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Application.Compras;
using InteliCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Dashboard;

/// <summary>Resultado de la búsqueda general. <c>Ruta</c> es la pantalla del frontend que lo abre.</summary>
public record ResultadoBusquedaDto(string Tipo, int Id, string Titulo, string? Subtitulo, string Ruta);

/// <summary>Aviso de la campana: algo que requiere atención (citas de hoy, cobros vencidos, ...).</summary>
public record AvisoDto(string Clave, string Titulo, string Detalle, int Cantidad, string Ruta, string Nivel);

/// <summary>
/// Datos de la barra superior: búsqueda general y avisos. Solo incluye los módulos
/// para los que el usuario tiene permiso de ver (<paramref name="puede"/>).
/// </summary>
public class BarraSuperiorService(IAppDbContext db, CompraService compras)
{
    private const int PorTipo = 5;

    public async Task<List<ResultadoBusquedaDto>> BuscarAsync(string? texto, Func<string, bool> puede, CancellationToken ct)
    {
        var t = texto?.Trim().ToLower() ?? string.Empty;
        if (t.Length < 2) return [];
        var resultados = new List<ResultadoBusquedaDto>();

        if (puede("prospectos.ver"))
        {
            var prospectos = await db.Prospectos.AsNoTracking()
                .Where(p => p.Activo && ((p.Nombre + " " + p.Apellidos).ToLower().Contains(t)
                                         || (p.Empresa != null && p.Empresa.ToLower().Contains(t))
                                         || (p.Correo != null && p.Correo.ToLower().Contains(t))
                                         || (p.Telefono != null && p.Telefono.Contains(t))))
                .OrderBy(p => p.Nombre).Take(PorTipo)
                .Select(p => new { p.Id, p.Nombre, p.Apellidos, p.Empresa, p.Etapa })
                .ToListAsync(ct);
            resultados.AddRange(prospectos.Select(p => new ResultadoBusquedaDto("Prospecto", p.Id,
                $"{p.Nombre} {p.Apellidos}".Trim(), string.Join(" · ", new[] { p.Empresa, p.Etapa.ToString() }.Where(x => x != null)),
                $"/prospectos/{p.Id}")));
        }

        if (puede("clientes.ver"))
        {
            var clientes = await db.Clientes.AsNoTracking()
                .Where(c => c.Activo && (c.RazonSocial.ToLower().Contains(t)
                                         || (c.NombreComercial != null && c.NombreComercial.ToLower().Contains(t))
                                         || (c.Rfc != null && c.Rfc.ToLower().Contains(t))
                                         || (c.ContactoPrincipal != null && c.ContactoPrincipal.ToLower().Contains(t))))
                .OrderBy(c => c.RazonSocial).Take(PorTipo)
                .Select(c => new { c.Id, c.RazonSocial, c.Rfc })
                .ToListAsync(ct);
            resultados.AddRange(clientes.Select(c => new ResultadoBusquedaDto("Cliente", c.Id, c.RazonSocial, c.Rfc,
                $"/clientes?buscar={Uri.EscapeDataString(c.RazonSocial)}")));
        }

        if (puede("cotizaciones.ver"))
        {
            var cotizaciones = await db.Cotizaciones.AsNoTracking()
                .Where(c => c.Folio.ToLower().Contains(t)
                            || (c.Prospecto != null && (c.Prospecto.Nombre + " " + c.Prospecto.Apellidos).ToLower().Contains(t))
                            || (c.Cliente != null && c.Cliente.RazonSocial.ToLower().Contains(t)))
                .OrderByDescending(c => c.Consecutivo).Take(PorTipo)
                .Select(c => new
                {
                    c.Id, c.Folio, c.Estatus, c.Total,
                    Para = c.Cliente != null ? c.Cliente.RazonSocial
                        : c.Prospecto != null ? c.Prospecto.Nombre + " " + c.Prospecto.Apellidos : null,
                })
                .ToListAsync(ct);
            resultados.AddRange(cotizaciones.Select(c => new ResultadoBusquedaDto("Cotización", c.Id, c.Folio,
                $"{c.Para} · {c.Estatus} · {FormatoTexto.Moneda(c.Total)}", $"/cotizaciones/{c.Id}")));
        }

        if (puede("cargos.ver"))
        {
            var cargos = await db.Cargos.AsNoTracking()
                .Where(c => c.Folio.ToLower().Contains(t)
                            || (c.Prospecto != null && (c.Prospecto.Nombre + " " + c.Prospecto.Apellidos).ToLower().Contains(t))
                            || (c.Cliente != null && c.Cliente.RazonSocial.ToLower().Contains(t)))
                .OrderByDescending(c => c.Consecutivo).Take(PorTipo)
                .Select(c => new
                {
                    c.Id, c.Folio, c.Total,
                    Para = c.Cliente != null ? c.Cliente.RazonSocial
                        : c.Prospecto != null ? c.Prospecto.Nombre + " " + c.Prospecto.Apellidos : null,
                })
                .ToListAsync(ct);
            resultados.AddRange(cargos.Select(c => new ResultadoBusquedaDto("Cargo", c.Id, c.Folio,
                $"{c.Para} · {FormatoTexto.Moneda(c.Total)}", $"/cargos/{c.Id}")));
        }

        if (puede("proveedores.ver"))
        {
            var proveedores = await db.Proveedores.AsNoTracking()
                .Where(p => p.Activo && (p.RazonSocial.ToLower().Contains(t)
                                         || (p.NombreComercial != null && p.NombreComercial.ToLower().Contains(t))
                                         || (p.Rfc != null && p.Rfc.ToLower().Contains(t))))
                .OrderBy(p => p.RazonSocial).Take(PorTipo)
                .Select(p => new { p.Id, p.RazonSocial, p.Rfc })
                .ToListAsync(ct);
            resultados.AddRange(proveedores.Select(p => new ResultadoBusquedaDto("Proveedor", p.Id, p.RazonSocial, p.Rfc,
                $"/proveedores?buscar={Uri.EscapeDataString(p.RazonSocial)}")));
        }

        if (puede("productos.ver"))
        {
            var productos = await db.Productos.AsNoTracking()
                .Where(p => p.Activo && (p.Nombre.ToLower().Contains(t) || p.Codigo.ToLower().Contains(t)))
                .OrderBy(p => p.Nombre).Take(PorTipo)
                .Select(p => new { p.Id, p.Codigo, p.Nombre })
                .ToListAsync(ct);
            resultados.AddRange(productos.Select(p => new ResultadoBusquedaDto("Producto", p.Id, p.Nombre, p.Codigo,
                $"/productos?buscar={Uri.EscapeDataString(p.Codigo)}")));
        }

        return resultados;
    }

    public async Task<List<AvisoDto>> AvisosAsync(Func<string, bool> puede, CancellationToken ct)
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        var avisos = new List<AvisoDto>();

        if (puede("citas.ver"))
        {
            var inicio = DateTime.Today;
            var pendientes = await db.Citas.AsNoTracking()
                .Where(c => c.FechaHoraInicio >= DateTime.Now && c.FechaHoraInicio < inicio.AddDays(1)
                            && (c.Estatus == EstatusCita.Programada || c.Estatus == EstatusCita.Confirmada))
                .OrderBy(c => c.FechaHoraInicio)
                .Select(c => new { c.FechaHoraInicio, Prospecto = c.Prospecto != null ? c.Prospecto.Nombre + " " + c.Prospecto.Apellidos : c.Cliente!.RazonSocial })
                .ToListAsync(ct);
            if (pendientes.Count > 0)
            {
                var siguiente = pendientes[0];
                avisos.Add(new AvisoDto("citas-hoy", Plural(pendientes.Count, "cita pendiente hoy", "citas pendientes hoy"),
                    $"La siguiente: {siguiente.FechaHoraInicio:HH:mm} con {siguiente.Prospecto}", pendientes.Count, "/citas", "info"));
            }
        }

        if (puede("prospectos.ver"))
        {
            var finDeHoy = DateTime.Today.AddDays(1);
            var seguimientos = await db.Bitacora.AsNoTracking()
                .CountAsync(b => b.FechaAviso != null && !b.AvisoAtendido && b.FechaAviso < finDeHoy && b.Prospecto!.Activo, ct);
            if (seguimientos > 0)
                avisos.Add(new AvisoDto("seguimientos", Plural(seguimientos, "seguimiento pendiente", "seguimientos pendientes"),
                    "Avisos de bitácora para hoy o atrasados", seguimientos, "/seguimiento", "alerta"));
        }

        if (puede("cobranza.ver"))
        {
            var vencidos = (await db.Cargos.AsNoTracking()
                    .Where(c => c.Estatus != EstatusDocumento.Cancelado && c.FechaVencimiento < hoy)
                    .Select(c => new { c.Saldo })
                    .ToListAsync(ct))
                .Where(c => c.Saldo > 0).ToList();
            if (vencidos.Count > 0)
                avisos.Add(new AvisoDto("cobros-vencidos", Plural(vencidos.Count, "cobro vencido", "cobros vencidos"),
                    $"{FormatoTexto.Moneda(vencidos.Sum(c => c.Saldo))} por cobrar fuera de plazo", vencidos.Count, "/cobranza", "peligro"));
        }

        if (puede("cuentas-pagar.ver"))
        {
            var porVencer = (await db.CuentasPorPagar.AsNoTracking()
                    .Where(c => c.Estatus != EstatusDocumento.Cancelado && c.FechaVencimiento <= hoy.AddDays(3))
                    .Select(c => new { c.Saldo })
                    .ToListAsync(ct))
                .Where(c => c.Saldo > 0).ToList();
            if (porVencer.Count > 0)
                avisos.Add(new AvisoDto("pagos-proveedor", Plural(porVencer.Count, "pago a proveedor vencido o por vencer", "pagos a proveedores vencidos o por vencer"),
                    $"{FormatoTexto.Moneda(porVencer.Sum(c => c.Saldo))} en los próximos 3 días o atrasados", porVencer.Count, "/cuentas-pagar", "alerta"));
        }

        if (puede("compras.ver"))
        {
            var faltantes = await compras.FaltantesAsync(ct);
            if (faltantes.Count > 0)
                avisos.Add(new AvisoDto("inventario-bajo", Plural(faltantes.Count, "producto bajo el mínimo", "productos bajo el mínimo"),
                    "Revisa el pedido de faltantes", faltantes.Count, "/compras/faltantes", "alerta"));
        }

        if (puede("cotizaciones.ver"))
        {
            var cotizaciones = await db.Cotizaciones.AsNoTracking()
                .Where(c => c.Estatus == EstatusCotizacion.Enviada)
                .Select(c => new { c.Fecha, c.VigenciaDias })
                .ToListAsync(ct);
            var porVencer = cotizaciones.Count(c => c.Fecha.AddDays(c.VigenciaDias) is var v && v >= hoy && v <= hoy.AddDays(3));
            if (porVencer > 0)
                avisos.Add(new AvisoDto("cotizaciones-por-vencer", Plural(porVencer, "cotización por vencer", "cotizaciones por vencer"),
                    "Enviadas y sin respuesta; vencen en 3 días o menos", porVencer, "/cotizaciones", "info"));
        }

        return avisos;
    }

    private static string Plural(int n, string uno, string varios) => $"{n} {(n == 1 ? uno : varios)}";
}
