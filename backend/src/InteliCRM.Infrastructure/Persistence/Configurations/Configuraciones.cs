using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InteliCRM.Infrastructure.Persistence.Configurations;

// Configuración de tablas, longitudes, índices y relaciones.
// Los índices únicos incluyen CuentaId: el mismo código o RFC puede existir en empresas distintas.

public class UnidadNegocioConfig : IEntityTypeConfiguration<UnidadNegocio>
{
    public void Configure(EntityTypeBuilder<UnidadNegocio> b)
    {
        b.ToTable("UnidadesNegocio");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Descripcion).HasMaxLength(500);
        b.HasIndex(x => new { x.CuentaId, x.Nombre }).IsUnique();
    }
}

public class PuestoConfig : IEntityTypeConfiguration<Puesto>
{
    public void Configure(EntityTypeBuilder<Puesto> b)
    {
        b.ToTable("Puestos");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Descripcion).HasMaxLength(500);
        b.HasIndex(x => new { x.CuentaId, x.Nombre }).IsUnique();
    }
}

public class AccionActividadConfig : IEntityTypeConfiguration<AccionActividad>
{
    public void Configure(EntityTypeBuilder<AccionActividad> b)
    {
        b.ToTable("AccionesActividades");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Descripcion).HasMaxLength(500);
        b.HasIndex(x => new { x.CuentaId, x.Nombre }).IsUnique();
    }
}

public class EmpleadoConfig : IEntityTypeConfiguration<Empleado>
{
    public void Configure(EntityTypeBuilder<Empleado> b)
    {
        b.ToTable("Empleados");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Apellidos).HasMaxLength(150).IsRequired();
        b.Property(x => x.Telefono).HasMaxLength(20);
        b.Property(x => x.Correo).HasMaxLength(150);
        b.Property(x => x.ColorAgenda).HasMaxLength(7).IsRequired();
        b.HasOne(x => x.Puesto).WithMany().HasForeignKey(x => x.PuestoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.UnidadNegocio).WithMany().HasForeignKey(x => x.UnidadNegocioId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class ClienteConfig : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> b)
    {
        b.ToTable("Clientes");
        b.Property(x => x.RazonSocial).HasMaxLength(200).IsRequired();
        b.Property(x => x.NombreComercial).HasMaxLength(200);
        b.Property(x => x.Rfc).HasMaxLength(13);
        b.Property(x => x.ContactoPrincipal).HasMaxLength(150);
        b.Property(x => x.Telefono).HasMaxLength(20);
        b.Property(x => x.Correo).HasMaxLength(150);
        b.Property(x => x.Direccion).HasMaxLength(500);
        b.HasIndex(x => new { x.CuentaId, x.Rfc }).IsUnique().HasFilter("[Rfc] IS NOT NULL");
    }
}

public class ProductoConfig : IEntityTypeConfiguration<Producto>
{
    public void Configure(EntityTypeBuilder<Producto> b)
    {
        b.ToTable("Productos");
        b.Property(x => x.Codigo).HasMaxLength(30).IsRequired();
        b.Property(x => x.Nombre).HasMaxLength(150).IsRequired();
        b.Property(x => x.Descripcion).HasMaxLength(1000);
        b.Property(x => x.Tipo).HasConversion<string>().HasMaxLength(20);
        b.HasIndex(x => new { x.CuentaId, x.Codigo }).IsUnique();
    }
}

public class ProspectoConfig : IEntityTypeConfiguration<Prospecto>
{
    public void Configure(EntityTypeBuilder<Prospecto> b)
    {
        b.ToTable("Prospectos");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Apellidos).HasMaxLength(150).IsRequired();
        b.Property(x => x.Empresa).HasMaxLength(200);
        b.Property(x => x.Cargo).HasMaxLength(100);
        b.Property(x => x.Telefono).HasMaxLength(20);
        b.Property(x => x.Correo).HasMaxLength(150);
        b.Property(x => x.Origen).HasMaxLength(100);
        b.Property(x => x.Notas).HasMaxLength(2000);
        b.Property(x => x.Etapa).HasConversion<string>().HasMaxLength(20);
        b.HasIndex(x => x.Etapa);

        b.HasOne(x => x.EmpleadoResponsable).WithMany().HasForeignKey(x => x.EmpleadoResponsableId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.UnidadNegocio).WithMany().HasForeignKey(x => x.UnidadNegocioId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class BitacoraEntradaConfig : IEntityTypeConfiguration<BitacoraEntrada>
{
    public void Configure(EntityTypeBuilder<BitacoraEntrada> b)
    {
        b.ToTable("Bitacora");
        b.Property(x => x.Descripcion).HasMaxLength(4000).IsRequired();
        b.HasOne(x => x.Prospecto).WithMany(p => p.Bitacora).HasForeignKey(x => x.ProspectoId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Empleado).WithMany().HasForeignKey(x => x.EmpleadoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.AccionActividad).WithMany().HasForeignKey(x => x.AccionActividadId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.ProspectoId, x.Fecha });
    }
}

public class CitaConfig : IEntityTypeConfiguration<Cita>
{
    public void Configure(EntityTypeBuilder<Cita> b)
    {
        b.ToTable("Citas");
        b.Property(x => x.Notas).HasMaxLength(1000);
        b.Property(x => x.Estatus).HasConversion<string>().HasMaxLength(20);
        b.HasOne(x => x.Prospecto).WithMany().HasForeignKey(x => x.ProspectoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Empleado).WithMany().HasForeignKey(x => x.EmpleadoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.AccionActividad).WithMany().HasForeignKey(x => x.AccionActividadId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.EmpleadoId, x.FechaHoraInicio });
    }
}

public class CotizacionConfig : IEntityTypeConfiguration<Cotizacion>
{
    public void Configure(EntityTypeBuilder<Cotizacion> b)
    {
        b.ToTable("Cotizaciones");
        b.Property(x => x.Folio).HasMaxLength(50).IsRequired();
        b.Property(x => x.Notas).HasMaxLength(2000);
        b.Property(x => x.Estatus).HasConversion<string>().HasMaxLength(20);
        b.HasIndex(x => new { x.CuentaId, x.Folio }).IsUnique();
        b.HasIndex(x => new { x.CuentaId, x.Consecutivo }).IsUnique();

        b.HasOne(x => x.Prospecto).WithMany().HasForeignKey(x => x.ProspectoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Empleado).WithMany().HasForeignKey(x => x.EmpleadoId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Partidas).WithOne().HasForeignKey(p => p.CotizacionId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CotizacionPartidaConfig : IEntityTypeConfiguration<CotizacionPartida>
{
    public void Configure(EntityTypeBuilder<CotizacionPartida> b)
    {
        b.ToTable("CotizacionPartidas");
        b.Property(x => x.Descripcion).HasMaxLength(500).IsRequired();
        b.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.ProductoId).OnDelete(DeleteBehavior.Restrict);
    }
}
