using InteliCRM.Application.Catalogos;
using InteliCRM.Application.Citas;
using InteliCRM.Application.Clientes;
using InteliCRM.Application.Cotizaciones;
using InteliCRM.Application.Dashboard;
using InteliCRM.Application.Empleados;
using InteliCRM.Application.Productos;
using InteliCRM.Application.Proveedores;
using InteliCRM.Application.Prospectos;
using InteliCRM.Application.Seguridad;
using InteliCRM.Application.Sucursales;
using Microsoft.Extensions.DependencyInjection;

namespace InteliCRM.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped(typeof(CatalogoService<>));
        services.AddScoped<EmpleadoService>();
        services.AddScoped<ClienteService>();
        services.AddScoped<ProductoService>();
        services.AddScoped<ProveedorService>();
        services.AddScoped<SucursalService>();
        services.AddScoped<ProspectoService>();
        services.AddScoped<CitaService>();
        services.AddScoped<CotizacionService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<AuthService>();
        services.AddScoped<UsuarioService>();
        services.AddScoped<RolService>();
        return services;
    }
}
