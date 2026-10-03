using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Common.Interfaces;

/// <summary>
/// Abstracción del DbContext. Los servicios dependen de esta interfaz,
/// no de la implementación concreta en Infrastructure.
/// </summary>
public interface IAppDbContext
{
    DbSet<Prospecto> Prospectos { get; }
    DbSet<BitacoraEntrada> Bitacora { get; }
    DbSet<Cita> Citas { get; }
    DbSet<Cotizacion> Cotizaciones { get; }
    DbSet<Cliente> Clientes { get; }
    DbSet<Producto> Productos { get; }
    DbSet<Empleado> Empleados { get; }
    DbSet<Puesto> Puestos { get; }
    DbSet<UnidadNegocio> UnidadesNegocio { get; }
    DbSet<AccionActividad> AccionesActividades { get; }
    DbSet<TipoContacto> TiposContacto { get; }
    DbSet<DescripcionServicio> DescripcionesServicio { get; }
    DbSet<InstrumentoPago> InstrumentosPago { get; }
    DbSet<CondicionPago> CondicionesPago { get; }
    DbSet<Proveedor> Proveedores { get; }
    DbSet<Sucursal> Sucursales { get; }
    DbSet<Almacen> Almacenes { get; }
    DbSet<Cargo> Cargos { get; }
    DbSet<PagoCargo> PagosCargo { get; }
    DbSet<CuentaPorPagar> CuentasPorPagar { get; }
    DbSet<PagoProveedor> PagosProveedor { get; }
    DbSet<ConfiguracionEmpresa> ConfiguracionesEmpresa { get; }
    DbSet<HorarioEmpleado> HorariosEmpleado { get; }
    DbSet<ListaPrecios> ListasPrecios { get; }
    DbSet<PrecioLista> PreciosLista { get; }
    DbSet<Existencia> Existencias { get; }
    DbSet<MovimientoInventario> MovimientosInventario { get; }
    DbSet<OrdenCompra> OrdenesCompra { get; }
    DbSet<PlantillaMensaje> PlantillasMensaje { get; }
    DbSet<MensajeEnviado> MensajesEnviados { get; }
    DbSet<Promocion> Promociones { get; }
    DbSet<Formato> Formatos { get; }
    DbSet<TicketSoporte> TicketsSoporte { get; }

    // Seguridad
    DbSet<Cuenta> Cuentas { get; }
    DbSet<Rol> Roles { get; }

    /// <summary>
    /// Usuarios de Identity. OJO: esta tabla NO se filtra automáticamente por cuenta
    /// (el login necesita buscar en todas); los servicios deben filtrar por CuentaId.
    /// </summary>
    DbSet<Usuario> Users { get; }

    DbSet<T> Set<T>() where T : class;

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
