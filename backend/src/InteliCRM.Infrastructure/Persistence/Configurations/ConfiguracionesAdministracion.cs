using InteliCRM.Domain.Common;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InteliCRM.Infrastructure.Persistence.Configurations;

// Catálogos administrativos: formas de pago, tipos de contacto, proveedores, sucursales y almacenes.

/// <summary>Configuración común de los catálogos simples: nombre único por cuenta.</summary>
public abstract class CatalogoConfig<T>(string tabla) : IEntityTypeConfiguration<T> where T : CatalogoBase
{
    public void Configure(EntityTypeBuilder<T> b)
    {
        b.ToTable(tabla);
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Descripcion).HasMaxLength(500);
        b.HasIndex(x => new { x.CuentaId, x.Nombre }).IsUnique();
    }
}

public class TipoContactoConfig() : CatalogoConfig<TipoContacto>("TiposContacto");
public class DescripcionServicioConfig() : CatalogoConfig<DescripcionServicio>("DescripcionesServicio");
public class InstrumentoPagoConfig() : CatalogoConfig<InstrumentoPago>("InstrumentosPago");
public class CondicionPagoConfig() : CatalogoConfig<CondicionPago>("CondicionesPago");

public class ProveedorConfig : IEntityTypeConfiguration<Proveedor>
{
    public void Configure(EntityTypeBuilder<Proveedor> b)
    {
        b.ToTable("Proveedores");
        b.Property(x => x.RazonSocial).HasMaxLength(200).IsRequired();
        b.Property(x => x.NombreComercial).HasMaxLength(200);
        b.Property(x => x.Rfc).HasMaxLength(13);
        b.Property(x => x.TipoPersona).HasConversion<string>().HasMaxLength(10);
        b.Property(x => x.Telefono).HasMaxLength(20);
        b.Property(x => x.Correo).HasMaxLength(150);
        b.Property(x => x.Direccion).HasMaxLength(500);
        b.Property(x => x.ContactoNombre).HasMaxLength(150);
        b.Property(x => x.ContactoTelefono).HasMaxLength(20);
        b.Property(x => x.ContactoCorreo).HasMaxLength(150);
        b.Property(x => x.Banco).HasMaxLength(100);
        b.Property(x => x.NumeroCuenta).HasMaxLength(30);
        b.Property(x => x.Clabe).HasMaxLength(18);
        b.Property(x => x.Notas).HasMaxLength(2000);
        b.HasIndex(x => new { x.CuentaId, x.Rfc }).IsUnique().HasFilter("[Rfc] IS NOT NULL");

        b.HasOne(x => x.TipoContacto).WithMany().HasForeignKey(x => x.TipoContactoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CondicionPago).WithMany().HasForeignKey(x => x.CondicionPagoId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.InstrumentoPago).WithMany().HasForeignKey(x => x.InstrumentoPagoId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class SucursalConfig : IEntityTypeConfiguration<Sucursal>
{
    public void Configure(EntityTypeBuilder<Sucursal> b)
    {
        b.ToTable("Sucursales");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Telefono).HasMaxLength(20);
        b.Property(x => x.Direccion).HasMaxLength(500);
        b.Property(x => x.CodigoPostal).HasMaxLength(5);
        b.HasIndex(x => new { x.CuentaId, x.Nombre }).IsUnique();
    }
}

public class AlmacenConfig : IEntityTypeConfiguration<Almacen>
{
    public void Configure(EntityTypeBuilder<Almacen> b)
    {
        b.ToTable("Almacenes");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Ubicacion).HasMaxLength(200);
        b.HasOne(x => x.Sucursal).WithMany(s => s.Almacenes).HasForeignKey(x => x.SucursalId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.SucursalId, x.Nombre }).IsUnique();
    }
}
