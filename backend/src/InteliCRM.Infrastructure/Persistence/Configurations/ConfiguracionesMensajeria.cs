using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InteliCRM.Infrastructure.Persistence.Configurations;

// Plantillas, mensajes enviados, promociones, formatos y soporte.

public class PlantillaMensajeConfig : IEntityTypeConfiguration<PlantillaMensaje>
{
    public void Configure(EntityTypeBuilder<PlantillaMensaje> b)
    {
        b.ToTable("PlantillasMensaje");
        b.Property(x => x.Tipo).HasConversion<string>().HasMaxLength(30);
        b.Property(x => x.Canal).HasConversion<string>().HasMaxLength(10);
        b.Property(x => x.Asunto).HasMaxLength(200);
        b.Property(x => x.Cuerpo).HasMaxLength(2000).IsRequired();
        b.HasIndex(x => new { x.CuentaId, x.Tipo, x.Canal }).IsUnique();
    }
}

public class MensajeEnviadoConfig : IEntityTypeConfiguration<MensajeEnviado>
{
    public void Configure(EntityTypeBuilder<MensajeEnviado> b)
    {
        b.ToTable("MensajesEnviados");
        b.Property(x => x.Canal).HasConversion<string>().HasMaxLength(10);
        b.Property(x => x.Estatus).HasConversion<string>().HasMaxLength(10);
        b.Property(x => x.Destinatario).HasMaxLength(150).IsRequired();
        b.Property(x => x.NombreDestinatario).HasMaxLength(200);
        b.Property(x => x.Asunto).HasMaxLength(200);
        b.Property(x => x.Cuerpo).HasMaxLength(4000).IsRequired();
        b.Property(x => x.Error).HasMaxLength(300);
        b.Property(x => x.Origen).HasMaxLength(50).IsRequired();
        b.HasIndex(x => x.Fecha);
        b.HasIndex(x => x.CitaId);
        b.HasIndex(x => x.PromocionId);
    }
}

public class PromocionConfig : IEntityTypeConfiguration<Promocion>
{
    public void Configure(EntityTypeBuilder<Promocion> b)
    {
        b.ToTable("Promociones");
        b.Property(x => x.Nombre).HasMaxLength(150).IsRequired();
        b.Property(x => x.Canal).HasConversion<string>().HasMaxLength(10);
        b.Property(x => x.Asunto).HasMaxLength(200);
        b.Property(x => x.Mensaje).HasMaxLength(2000).IsRequired();
    }
}

public class FormatoConfig : IEntityTypeConfiguration<Formato>
{
    public void Configure(EntityTypeBuilder<Formato> b)
    {
        b.ToTable("Formatos");
        b.Property(x => x.Nombre).HasMaxLength(150).IsRequired();
        b.Property(x => x.Categoria).HasMaxLength(100);
        b.Property(x => x.NombreArchivo).HasMaxLength(255).IsRequired();
        b.Property(x => x.TipoContenido).HasMaxLength(150).IsRequired();
    }
}

public class TicketSoporteConfig : IEntityTypeConfiguration<TicketSoporte>
{
    public void Configure(EntityTypeBuilder<TicketSoporte> b)
    {
        b.ToTable("TicketsSoporte");
        b.Property(x => x.Asunto).HasMaxLength(150).IsRequired();
        b.Property(x => x.Mensaje).HasMaxLength(4000).IsRequired();
        b.Property(x => x.NombreContacto).HasMaxLength(150).IsRequired();
        b.Property(x => x.CorreoContacto).HasMaxLength(150).IsRequired();
        b.Property(x => x.EstatusEnvio).HasConversion<string>().HasMaxLength(10);
    }
}
