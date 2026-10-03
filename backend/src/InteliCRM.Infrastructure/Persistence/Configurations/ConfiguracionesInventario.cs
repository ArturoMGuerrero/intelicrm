using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InteliCRM.Infrastructure.Persistence.Configurations;

// Inventario (existencias y kárdex) y compras.

public class ExistenciaConfig : IEntityTypeConfiguration<Existencia>
{
    public void Configure(EntityTypeBuilder<Existencia> b)
    {
        b.ToTable("Existencias");
        b.Property(x => x.Cantidad).HasPrecision(18, 4);
        b.Property(x => x.CostoPromedio).HasPrecision(18, 4);
        b.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.ProductoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Almacen).WithMany().HasForeignKey(x => x.AlmacenId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.ProductoId, x.AlmacenId }).IsUnique();
    }
}

public class MovimientoInventarioConfig : IEntityTypeConfiguration<MovimientoInventario>
{
    public void Configure(EntityTypeBuilder<MovimientoInventario> b)
    {
        b.ToTable("MovimientosInventario");
        b.Property(x => x.Tipo).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.Cantidad).HasPrecision(18, 4);
        b.Property(x => x.ExistenciaAnterior).HasPrecision(18, 4);
        b.Property(x => x.ExistenciaNueva).HasPrecision(18, 4);
        b.Property(x => x.CostoUnitario).HasPrecision(18, 4);
        b.Property(x => x.Referencia).HasMaxLength(30);
        b.Property(x => x.Notas).HasMaxLength(300);
        b.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.ProductoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Almacen).WithMany().HasForeignKey(x => x.AlmacenId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.ProductoId, x.AlmacenId, x.Fecha });
    }
}

public class OrdenCompraConfig : IEntityTypeConfiguration<OrdenCompra>
{
    public void Configure(EntityTypeBuilder<OrdenCompra> b)
    {
        b.ToTable("OrdenesCompra");
        b.Property(x => x.Folio).HasMaxLength(20).IsRequired();
        b.Property(x => x.Notas).HasMaxLength(2000);
        b.Property(x => x.MotivoCancelacion).HasMaxLength(500);
        b.Property(x => x.Estatus).HasConversion<string>().HasMaxLength(20);
        b.HasIndex(x => new { x.CuentaId, x.Folio }).IsUnique();
        b.HasIndex(x => new { x.CuentaId, x.Consecutivo }).IsUnique();
        b.HasOne(x => x.Proveedor).WithMany().HasForeignKey(x => x.ProveedorId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Almacen).WithMany().HasForeignKey(x => x.AlmacenId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CondicionPago).WithMany().HasForeignKey(x => x.CondicionPagoId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Partidas).WithOne().HasForeignKey(p => p.OrdenCompraId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class OrdenCompraPartidaConfig : IEntityTypeConfiguration<OrdenCompraPartida>
{
    public void Configure(EntityTypeBuilder<OrdenCompraPartida> b)
    {
        b.ToTable("OrdenCompraPartidas");
        b.Property(x => x.Descripcion).HasMaxLength(500).IsRequired();
        b.Property(x => x.Cantidad).HasPrecision(18, 4);
        b.Property(x => x.CantidadRecibida).HasPrecision(18, 4);
        b.Property(x => x.CostoUnitario).HasPrecision(18, 4);
        b.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.ProductoId).OnDelete(DeleteBehavior.Restrict);
    }
}
