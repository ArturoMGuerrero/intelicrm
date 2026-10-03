using System.Security.Cryptography;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using InteliCRM.Api.Infrastructure;
using InteliCRM.Api.Seguridad;
using InteliCRM.Application;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using InteliCRM.Infrastructure;
using InteliCRM.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Capas de la aplicación
builder.Services.AddApplication();
builder.Services.AddInfrastructure(
    proveedor: builder.Configuration["BaseDeDatos:Proveedor"],
    connectionString: builder.Configuration.GetConnectionString("InteliCRM"));

// Usuario actual (lo leen el DbContext y los servicios para saber la cuenta).
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUsuarioActual, UsuarioActual>();

// Envío de correos y SMS (sección "Mensajeria"; sin configuración, el envío es simulado).
builder.Services.Configure<OpcionesMensajeria>(builder.Configuration.GetSection(OpcionesMensajeria.Seccion));
builder.Services.AddHttpClient<IEnviadorMensajes, EnviadorMensajes>(c => c.Timeout = TimeSpan.FromSeconds(20));

// ---------- Autenticación JWT ----------
var jwt = builder.Configuration.GetSection(OpcionesJwt.Seccion).Get<OpcionesJwt>() ?? new OpcionesJwt();
if (jwt.Clave.Length < 32 && builder.Environment.IsDevelopment())
{
    // Solo en desarrollo: si no hay clave configurada, se genera una aleatoria y se guarda en un archivo
    // local (excluido de Git) para que las sesiones sobrevivan a reinicios. En producción es obligatoria.
    var archivoClave = Path.Combine(builder.Environment.ContentRootPath, "jwt-desarrollo.key");
    if (!File.Exists(archivoClave))
        File.WriteAllText(archivoClave, Convert.ToBase64String(RandomNumberGenerator.GetBytes(48)));
    jwt.Clave = File.ReadAllText(archivoClave).Trim();
}
if (jwt.Clave.Length < 32)
    throw new InvalidOperationException(
        "Falta 'Jwt:Clave' (mínimo 32 caracteres). En desarrollo, guárdala con user-secrets: " +
        $"dotnet user-secrets --project \"{builder.Environment.ContentRootPath}\" set Jwt:Clave \"<cadena aleatoria de 32+ caracteres>\" " +
        "(ver README, sección 'Cómo ejecutarlo').");
builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton<TokenService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false; // conservar "sub", "cuenta", "permiso" tal cual
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Emisor,
            ValidAudience = jwt.Audiencia,
            IssuerSigningKey = jwt.LlaveFirma(),
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = Claims.Nombre,
        };
        o.Events = new JwtBearerEvents
        {
            // Rechaza tokens de usuarios desactivados o cuyo rol/permisos cambiaron
            // (al cambiar, se renueva el sello de seguridad del usuario).
            OnTokenValidated = async ctx =>
            {
                var usuarios = ctx.HttpContext.RequestServices.GetRequiredService<UserManager<Usuario>>();
                var usuario = await usuarios.FindByIdAsync(ctx.Principal?.FindFirst(Claims.UsuarioId)?.Value ?? "");
                var sello = ctx.Principal?.FindFirst(Claims.SelloSeguridad)?.Value;
                if (usuario is null || !usuario.Activo || usuario.SecurityStamp != sello)
                    ctx.Fail("La sesión ya no es válida.");
            },
        };
    });

builder.Services.AddSingleton<IAuthorizationPolicyProvider, ProveedorPoliticasPermiso>();
builder.Services.AddSingleton<IAuthorizationHandler, ManejadorPermiso>();
builder.Services.AddAuthorization(o =>
{
    // Todo endpoint exige sesión, salvo los marcados con [AllowAnonymous] (login).
    o.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
});

// Máximo 10 intentos de login por minuto por IP (además del bloqueo por usuario de Identity).
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

// Enums como texto en JSON ("Nuevo", "Programada"...) para que el frontend sea legible.
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ManejadorErrores>();
builder.Services.AddOpenApi();

// El frontend de React (Vite) corre en otro puerto durante el desarrollo.
var origenesPermitidos = builder.Configuration.GetSection("Cors:Origenes").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(origenesPermitidos).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference(o => o.WithTitle("InteliCRM API")).AllowAnonymous();

    // Aplica las migraciones pendientes y, si la base está vacía, carga datos de ejemplo.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsRelational())
        await db.Database.MigrateAsync();
    await scope.ServiceProvider.GetRequiredService<DatosDemo>().CargarAsync();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
