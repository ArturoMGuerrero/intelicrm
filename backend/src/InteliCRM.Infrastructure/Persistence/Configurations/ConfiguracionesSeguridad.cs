using InteliCRM.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InteliCRM.Infrastructure.Persistence.Configurations;

public class CuentaConfig : IEntityTypeConfiguration<Cuenta>
{
    public void Configure(EntityTypeBuilder<Cuenta> b)
    {
        b.ToTable("Cuentas");
        b.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
    }
}

public class RolConfig : IEntityTypeConfiguration<Rol>
{
    public void Configure(EntityTypeBuilder<Rol> b)
    {
        b.ToTable("Roles");
        b.Property(x => x.Nombre).HasMaxLength(100).IsRequired();
        b.Property(x => x.Descripcion).HasMaxLength(500);
        // Lista de permisos guardada como JSON en una sola columna.
        b.PrimitiveCollection(x => x.Permisos);
        b.HasIndex(x => new { x.CuentaId, x.Nombre }).IsUnique();
    }
}

public class UsuarioConfig : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> b)
    {
        b.ToTable("Usuarios");
        b.Property(x => x.Nombre).HasMaxLength(150).IsRequired();
        b.HasIndex(x => x.CuentaId);

        b.HasOne(x => x.Cuenta).WithMany().HasForeignKey(x => x.CuentaId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Rol).WithMany().HasForeignKey(x => x.RolId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Empleado).WithMany().HasForeignKey(x => x.EmpleadoId).OnDelete(DeleteBehavior.SetNull);
    }
}

// Nombres en español para las tablas auxiliares de Identity.
public class UsuarioClaimConfig : IEntityTypeConfiguration<IdentityUserClaim<int>>
{
    public void Configure(EntityTypeBuilder<IdentityUserClaim<int>> b) => b.ToTable("UsuariosClaims");
}

public class UsuarioLoginConfig : IEntityTypeConfiguration<IdentityUserLogin<int>>
{
    public void Configure(EntityTypeBuilder<IdentityUserLogin<int>> b) => b.ToTable("UsuariosLoginsExternos");
}

public class UsuarioTokenConfig : IEntityTypeConfiguration<IdentityUserToken<int>>
{
    public void Configure(EntityTypeBuilder<IdentityUserToken<int>> b) => b.ToTable("UsuariosTokens");
}
