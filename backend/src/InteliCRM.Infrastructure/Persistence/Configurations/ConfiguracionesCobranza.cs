using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InteliCRM.Infrastructure.Persistence.Configurations;

// Cargos (cuentas por cobrar), cuentas por pagar y sus pagos.

internal static class ConfiguracionDocumento
{
    /// <summary>Columnas comunes de un documento con saldo; el folio es único por cuenta.</summary>
    public static void Comun<T>(EntityTypeBuilder<T> b) where T : DocumentoConSaldo
    {
        b.Property(x => x.Folio).HasMaxLength(20).IsRequired();
        b.Property(x => x.Notas).HasMaxLength(2000);
        b.Property(x => x.MotivoCancelacion).HasMaxLength(500);
        b.Property(x => x.Estatus).HasConversion<string>().HasMaxLength(20);
        b.HasIndex(x => new { x.CuentaId, x.Folio }).IsUnique();
        b.HasIndex(x => new { x.CuentaId, x.Consecutivo }).IsUnique();
        b.HasIndex(x => x.FechaVencimiento);
        b.HasOne(x => x.CondicionPago).WithMany().HasForeignKey(x => x.CondicionPagoId).OnDelete(DeleteBehavior.Restrict);
    }

    public static void Pago<T>(EntityTypeBuilder<T> b) where T : PagoBase
    {
        b.Property(x => x.Referencia).HasMaxLength(100);
        b.Property(x => x.Notas).HasMaxLength(500);
        b.HasOne(x => x.InstrumentoPago).WithMany().HasForeignKey(x => x.InstrumentoPagoId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class CargoConfig : IEntityTypeConfiguration<Cargo>
{
    public void Configure(EntityTypeBuilder<Cargo> b)
    {
        b.ToTable("Cargos");
        ConfiguracionDocumento.Comun(b);
        b.HasOne(x => x.Prospecto).WithMany().HasForeignKey(x => x.ProspectoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Cliente).WithMany().HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Empleado).WithMany().HasForeignKey(x => x.EmpleadoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Cotizacion).WithMany().HasForeignKey(x => x.CotizacionId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Partidas).WithOne().HasForeignKey(p => p.CargoId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Pagos).WithOne().HasForeignKey(p => p.CargoId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class CargoPartidaConfig : IEntityTypeConfiguration<CargoPartida>
{
    public void Configure(EntityTypeBuilder<CargoPartida> b)
    {
        b.ToTable("CargoPartidas");
        b.Property(x => x.Descripcion).HasMaxLength(500).IsRequired();
        b.HasOne(x => x.Producto).WithMany().HasForeignKey(x => x.ProductoId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class PagoCargoConfig : IEntityTypeConfiguration<PagoCargo>
{
    public void Configure(EntityTypeBuilder<PagoCargo> b)
    {
        b.ToTable("PagosCargo");
        ConfiguracionDocumento.Pago(b);
        b.HasIndex(x => x.Fecha);
    }
}

public class CuentaPorPagarConfig : IEntityTypeConfiguration<CuentaPorPagar>
{
    public void Configure(EntityTypeBuilder<CuentaPorPagar> b)
    {
        b.ToTable("CuentasPorPagar");
        ConfiguracionDocumento.Comun(b);
        b.Property(x => x.FolioProveedor).HasMaxLength(50);
        b.Property(x => x.Concepto).HasMaxLength(300).IsRequired();
        b.HasOne(x => x.Proveedor).WithMany().HasForeignKey(x => x.ProveedorId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Pagos).WithOne().HasForeignKey(p => p.CuentaPorPagarId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class PagoProveedorConfig : IEntityTypeConfiguration<PagoProveedor>
{
    public void Configure(EntityTypeBuilder<PagoProveedor> b)
    {
        b.ToTable("PagosProveedor");
        ConfiguracionDocumento.Pago(b);
        b.HasIndex(x => x.Fecha);
    }
}
