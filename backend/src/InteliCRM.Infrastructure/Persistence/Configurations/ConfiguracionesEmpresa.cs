using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InteliCRM.Infrastructure.Persistence.Configurations;

// Mi empresa, horarios de empleados y listas de precios.

public class ConfiguracionEmpresaConfig : IEntityTypeConfiguration<ConfiguracionEmpresa>
{
    public void Configure(EntityTypeBuilder<ConfiguracionEmpresa> b)
    {
        b.ToTable("ConfiguracionEmpresa");
        b.Property(x => x.RazonSocial).HasMaxLength(250).IsRequired();
        b.Property(x => x.NombreComercial).HasMaxLength(200);
        b.Property(x => x.Rfc).HasMaxLength(13);
        b.Property(x => x.RegimenFiscal).HasMaxLength(3);
        b.Property(x => x.CodigoPostal).HasMaxLength(5);
        b.Property(x => x.Direccion).HasMaxLength(500);
        b.Property(x => x.Telefono).HasMaxLength(20);
        b.Property(x => x.Correo).HasMaxLength(150);
        b.Property(x => x.SitioWeb).HasMaxLength(200);
        b.Property(x => x.SerieFactura).HasMaxLength(10);
        b.Property(x => x.PieDocumentos).HasMaxLength(1000);
        // Una configuración por cuenta (además del índice simple que crea el filtro multi-cuenta).
        b.HasIndex(x => x.CuentaId).IsUnique();
        b.HasMany(x => x.CuentasBancarias).WithOne().HasForeignKey(c => c.ConfiguracionEmpresaId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CuentaBancariaEmpresaConfig : IEntityTypeConfiguration<CuentaBancariaEmpresa>
{
    public void Configure(EntityTypeBuilder<CuentaBancariaEmpresa> b)
    {
        b.ToTable("CuentasBancariasEmpresa");
        b.Property(x => x.Banco).HasMaxLength(100).IsRequired();
        b.Property(x => x.NumeroCuenta).HasMaxLength(30);
        b.Property(x => x.Clabe).HasMaxLength(18);
        b.Property(x => x.Descripcion).HasMaxLength(200);
    }
}

public class HorarioEmpleadoConfig : IEntityTypeConfiguration<HorarioEmpleado>
{
    public void Configure(EntityTypeBuilder<HorarioEmpleado> b)
    {
        b.ToTable("HorariosEmpleado");
        b.Property(x => x.Dia).HasConversion<int>();
        b.HasOne(x => x.Empleado).WithMany().HasForeignKey(x => x.EmpleadoId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.EmpleadoId, x.Dia });
    }
}

public class ListaPreciosConfig : IEntityTypeConfiguration<ListaPrecios>
{
    public void Configure(EntityTypeBuilder<ListaPrecios> b)
    {
        b.ToTable("ListasPrecios");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Descripcion).HasMaxLength(500);
        b.HasIndex(x => new { x.CuentaId, x.Nombre }).IsUnique();
        b.HasMany(x => x.Precios).WithOne().HasForeignKey(p => p.ListaPreciosId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class PrecioListaConfig : IEntityTypeConfiguration<PrecioLista>
{
    public void Configure(EntityTypeBuilder<PrecioLista> b)
    {
        b.ToTable("PreciosLista");
        b.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.ProductoId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.ListaPreciosId, x.ProductoId }).IsUnique();
    }
}
