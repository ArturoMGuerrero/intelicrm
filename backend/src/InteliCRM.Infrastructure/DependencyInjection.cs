using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Application.Seguridad;
using InteliCRM.Domain.Entities;
using InteliCRM.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace InteliCRM.Infrastructure;

public static class DependencyInjection
{
    /// <param name="proveedor">"Sqlite" (desarrollo local), "SqlServer" o "InMemory" (pruebas rápidas, no guarda nada).</param>
    /// <param name="connectionString">Obligatoria para Sqlite y SqlServer.</param>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, string? proveedor, string? connectionString)
    {
        services.AddDbContext<AppDbContext>(options =>
        {
            // Usuario → Rol es obligatorio y Rol tiene filtro por cuenta. Es seguro: un usuario y su rol
            // siempre pertenecen a la misma cuenta, y el login consulta con IgnoreQueryFilters().
            options.ConfigureWarnings(w => w.Ignore(CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning));

            switch (proveedor?.ToLowerInvariant())
            {
                case "sqlite":
                    options.UseSqlite(Requerida(connectionString));
                    break;
                case "sqlserver":
                    options.UseSqlServer(Requerida(connectionString));
                    break;
                case "inmemory":
                    options.UseInMemoryDatabase("InteliCRM");
                    break;
                default:
                    throw new InvalidOperationException(
                        $"Proveedor de base de datos '{proveedor}' no soportado. Usa Sqlite, SqlServer o InMemory.");
            }
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<DatosDemo>();

        // Identity: solo el manejo de usuarios (hash de contraseñas, bloqueo, sello de seguridad).
        // La emisión y validación de tokens la hace la API con JWT.
        services.AddIdentityCore<Usuario>(o =>
            {
                o.User.RequireUniqueEmail = true;
                o.Password.RequiredLength = 8;
                o.Password.RequireDigit = true;
                o.Password.RequireLowercase = true;
                o.Password.RequireUppercase = true;
                o.Password.RequireNonAlphanumeric = false;
                o.Lockout.MaxFailedAccessAttempts = 5;
                o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                o.Lockout.AllowedForNewUsers = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddErrorDescriber<ErroresIdentityEspanol>();

        return services;
    }

    private static string Requerida(string? connectionString) =>
        string.IsNullOrWhiteSpace(connectionString)
            ? throw new InvalidOperationException("Falta la cadena de conexión 'ConnectionStrings:InteliCRM'.")
            : connectionString;
}
