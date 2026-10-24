using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Plataforma;
using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Seguridad;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Infrastructure.Persistence;

/// <summary>
/// Da de alta una empresa: la cuenta, los roles base (Administrador, Gerente comercial, Vendedor),
/// catálogos mínimos de pago y actividades, y su usuario administrador. Todo en una transacción:
/// si algo falla (p. ej. la contraseña no cumple las reglas) no queda nada a medias.
/// </summary>
public class CreadorCuentas(AppDbContext db, UserManager<Usuario> usuarios) : ICreadorCuentas
{
    public async Task<int> CrearAsync(string empresa, string nombreAdmin, string correoAdmin, string passwordAdmin, CancellationToken ct)
    {
        // Validaciones antes de crear nada (el correo es único en todo el sistema).
        if (await usuarios.FindByEmailAsync(correoAdmin) is not null)
            throw new ReglaNegocioException($"Ya existe un usuario con el correo {correoAdmin}.");
        var prueba = new Usuario { UserName = correoAdmin, Email = correoAdmin };
        foreach (var validador in usuarios.PasswordValidators)
        {
            var resultado = await validador.ValidateAsync(usuarios, prueba, passwordAdmin);
            if (!resultado.Succeeded)
                throw new ReglaNegocioException(string.Join(" ", resultado.Errors.Select(e => e.Description).Distinct()));
        }

        await using var transaccion = await db.Database.BeginTransactionAsync(ct);
        try
        {
            var cuenta = new Cuenta { Nombre = empresa, FechaCreacion = DateTime.Now };
            db.Cuentas.Add(cuenta);
            await db.SaveChangesAsync(ct);
            db.UsarCuenta(cuenta.Id);

            db.InstrumentosPago.AddRange(new InstrumentoPago { Nombre = "Efectivo" }, new InstrumentoPago { Nombre = "Transferencia electrónica" },
                new InstrumentoPago { Nombre = "Tarjeta de crédito/débito" }, new InstrumentoPago { Nombre = "Cheque" });
            db.CondicionesPago.AddRange(new CondicionPago { Nombre = "Contado", DiasCredito = 0 },
                new CondicionPago { Nombre = "Crédito 30 días", DiasCredito = 30 }, new CondicionPago { Nombre = "Crédito 60 días", DiasCredito = 60 });
            db.AccionesActividades.AddRange(
                new AccionActividad { Nombre = "Llamada", DuracionMinutos = 15 },
                new AccionActividad { Nombre = "Videollamada", DuracionMinutos = 30 },
                new AccionActividad { Nombre = "Visita presencial", DuracionMinutos = 90 },
                new AccionActividad { Nombre = "Correo", DuracionMinutos = 10 });

            var admin = new Rol { Nombre = "Administrador", Descripcion = "Acceso total al sistema.", EsAdministrador = true };
            db.Roles.AddRange(admin,
                new Rol
                {
                    Nombre = "Gerente comercial", Descripcion = "Todo lo comercial y catálogos; sin administrar usuarios.",
                    Permisos = Permisos.Todos.Where(p => !p.StartsWith("usuarios.") && !p.StartsWith("roles.")).ToList(),
                },
                new Rol
                {
                    Nombre = "Vendedor", Descripcion = "Da seguimiento a prospectos, agenda citas y cotiza. Solo consulta catálogos.",
                    Permisos =
                    [
                        "prospectos.ver", "prospectos.editar", "citas.ver", "citas.editar", "citas.eliminar",
                        "cotizaciones.ver", "cotizaciones.editar", "clientes.ver", "productos.ver", "empleados.ver", "catalogos.ver",
                    ],
                });
            await db.SaveChangesAsync(ct);

            var usuario = new Usuario
            {
                CuentaId = cuenta.Id, Nombre = nombreAdmin, Email = correoAdmin, UserName = correoAdmin,
                EmailConfirmed = true, LockoutEnabled = true, RolId = admin.Id, FechaCreacion = DateTime.Now,
            };
            var creado = await usuarios.CreateAsync(usuario, passwordAdmin);
            if (!creado.Succeeded)
                throw new ReglaNegocioException(string.Join(" ", creado.Errors.Select(e => e.Description).Distinct()));

            await transaccion.CommitAsync(ct);
            return cuenta.Id;
        }
        finally
        {
            db.UsarCuenta(null);
        }
    }
}
