using System.Linq.Expressions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Common;
using InteliCRM.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Infrastructure.Persistence;

/// <summary>
/// DbContext principal. Además de las tablas de negocio incluye las de usuarios de Identity.
///
/// Multi-cuenta: todas las entidades que heredan de <see cref="EntidadBase"/> tienen un filtro
/// global "CuentaId == cuenta del usuario actual". Sin sesión, las consultas no regresan nada.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options, IUsuarioActual usuarioActual)
    : IdentityUserContext<Usuario, int>(options), IAppDbContext
{
    public DbSet<Prospecto> Prospectos => Set<Prospecto>();
    public DbSet<BitacoraEntrada> Bitacora => Set<BitacoraEntrada>();
    public DbSet<Cita> Citas => Set<Cita>();
    public DbSet<Cotizacion> Cotizaciones => Set<Cotizacion>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Empleado> Empleados => Set<Empleado>();
    public DbSet<Puesto> Puestos => Set<Puesto>();
    public DbSet<UnidadNegocio> UnidadesNegocio => Set<UnidadNegocio>();
    public DbSet<AccionActividad> AccionesActividades => Set<AccionActividad>();
    public DbSet<TipoContacto> TiposContacto => Set<TipoContacto>();
    public DbSet<DescripcionServicio> DescripcionesServicio => Set<DescripcionServicio>();
    public DbSet<InstrumentoPago> InstrumentosPago => Set<InstrumentoPago>();
    public DbSet<CondicionPago> CondicionesPago => Set<CondicionPago>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<Almacen> Almacenes => Set<Almacen>();
    public DbSet<Cargo> Cargos => Set<Cargo>();
    public DbSet<PagoCargo> PagosCargo => Set<PagoCargo>();
    public DbSet<CuentaPorPagar> CuentasPorPagar => Set<CuentaPorPagar>();
    public DbSet<PagoProveedor> PagosProveedor => Set<PagoProveedor>();
    public DbSet<ConfiguracionEmpresa> ConfiguracionesEmpresa => Set<ConfiguracionEmpresa>();
    public DbSet<HorarioEmpleado> HorariosEmpleado => Set<HorarioEmpleado>();
    public DbSet<ListaPrecios> ListasPrecios => Set<ListaPrecios>();
    public DbSet<PrecioLista> PreciosLista => Set<PrecioLista>();
    public DbSet<Existencia> Existencias => Set<Existencia>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<OrdenCompra> OrdenesCompra => Set<OrdenCompra>();
    public DbSet<PlantillaMensaje> PlantillasMensaje => Set<PlantillaMensaje>();
    public DbSet<MensajeEnviado> MensajesEnviados => Set<MensajeEnviado>();
    public DbSet<Promocion> Promociones => Set<Promocion>();
    public DbSet<Formato> Formatos => Set<Formato>();
    public DbSet<TicketSoporte> TicketsSoporte => Set<TicketSoporte>();
    public DbSet<Cuenta> Cuentas => Set<Cuenta>();
    public DbSet<Rol> Roles => Set<Rol>();

    private int? _cuentaForzada;

    /// <summary>Cuenta usada por el filtro global. EF la evalúa en cada consulta.</summary>
    public int? CuentaIdActual => _cuentaForzada ?? usuarioActual.CuentaId;

    /// <summary>
    /// Fija la cuenta sin que haya un usuario con sesión. Solo para procesos internos
    /// (carga de datos de ejemplo, tareas programadas).
    /// </summary>
    public void UsarCuenta(int? cuentaId) => _cuentaForzada = cuentaId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder); // tablas de Identity
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Filtro por cuenta en todas las entidades de negocio.
        foreach (var tipo in modelBuilder.Model.GetEntityTypes()
                     .Where(t => typeof(EntidadBase).IsAssignableFrom(t.ClrType) && t.BaseType is null))
        {
            var parametro = Expression.Parameter(tipo.ClrType, "e");
            var cuentaEntidad = Expression.Convert(
                Expression.Property(parametro, nameof(EntidadBase.CuentaId)), typeof(int?));
            var cuentaActual = Expression.Property(Expression.Constant(this), nameof(CuentaIdActual));
            var filtro = Expression.Lambda(Expression.Equal(cuentaEntidad, cuentaActual), parametro);

            modelBuilder.Entity(tipo.ClrType).HasQueryFilter(filtro);
            modelBuilder.Entity(tipo.ClrType).HasIndex(nameof(EntidadBase.CuentaId));
            modelBuilder.Entity(tipo.ClrType)
                .HasOne(typeof(Cuenta)).WithMany().HasForeignKey(nameof(EntidadBase.CuentaId))
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Todos los importes con 2 decimales (en SQL Server: decimal(18,2)).
        configurationBuilder.Properties<decimal>().HavePrecision(18, 2);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var ahora = DateTime.Now;
        var usuarioId = usuarioActual.UsuarioId;

        foreach (var entry in ChangeTracker.Entries<EntidadBase>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    if (entry.Entity.CuentaId == 0)
                        entry.Entity.CuentaId = CuentaIdActual
                            ?? throw new InvalidOperationException(
                                $"No se puede guardar {entry.Entity.GetType().Name} sin una cuenta activa.");
                    entry.Entity.FechaCreacion = ahora;
                    entry.Entity.CreadoPorId = usuarioId;
                    break;

                case EntityState.Modified:
                    // Un registro nunca cambia de empresa.
                    entry.Property(e => e.CuentaId).IsModified = false;
                    entry.Property(e => e.FechaCreacion).IsModified = false;
                    entry.Property(e => e.CreadoPorId).IsModified = false;
                    entry.Entity.FechaModificacion = ahora;
                    entry.Entity.ModificadoPorId = usuarioId;
                    break;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
