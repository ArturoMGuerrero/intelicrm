using InteliCRM.Domain.Entities;
using InteliCRM.Domain.Enums;
using InteliCRM.Domain.Seguridad;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Infrastructure.Persistence;

/// <summary>
/// Usuarios de prueba que crea <see cref="DatosDemo"/>. SOLO para desarrollo local:
/// la carga de datos de ejemplo no se ejecuta fuera del ambiente Development.
/// </summary>
public static class UsuariosDemo
{
    public const string AdminCorreo = "admin@demo.local";
    public const string AdminPassword = "AdminDemo2026";
    public const string VendedorCorreo = "carlos@demo.local";
    public const string VendedorPassword = "VendedorDemo2026";
    public const string OtraEmpresaCorreo = "admin@otraempresa.local";
    public const string OtraEmpresaPassword = "OtraEmpresa2026";
}

/// <summary>
/// Carga datos de ejemplo cuando la base está vacía. Crea dos empresas (cuentas) para
/// poder comprobar que una no ve los datos de la otra. Solo se ejecuta en desarrollo.
/// </summary>
public class DatosDemo(AppDbContext db, UserManager<Usuario> usuarios)
{
    public async Task CargarAsync(CancellationToken ct = default)
    {
        if (await db.Cuentas.AnyAsync(ct))
            return;

        try
        {
            await CargarCuentaPrincipalAsync(ct);
            await CargarSegundaCuentaAsync(ct);
        }
        finally
        {
            db.UsarCuenta(null);
        }
    }

    private async Task CargarCuentaPrincipalAsync(CancellationToken ct)
    {
        var cuenta = new Cuenta { Nombre = "Comercializadora Demo", FechaCreacion = DateTime.Now };
        db.Cuentas.Add(cuenta);
        await db.SaveChangesAsync(ct);
        db.UsarCuenta(cuenta.Id);

        // ---------- Catálogos ----------
        var corporativo = new UnidadNegocio { Nombre = "Corporativo", Descripcion = "Empresas medianas y grandes" };
        var pymes = new UnidadNegocio { Nombre = "PyMEs", Descripcion = "Pequeñas y medianas empresas" };
        db.UnidadesNegocio.AddRange(corporativo, pymes);

        var ejecutivo = new Puesto { Nombre = "Ejecutivo de ventas" };
        var gerente = new Puesto { Nombre = "Gerente comercial" };
        var soporte = new Puesto { Nombre = "Soporte técnico" };
        db.Puestos.AddRange(ejecutivo, gerente, soporte);

        var llamada = new AccionActividad { Nombre = "Llamada", Descripcion = "Llamada telefónica de seguimiento", DuracionMinutos = 15 };
        var videollamada = new AccionActividad { Nombre = "Videollamada", Descripcion = "Reunión por Teams/Zoom/Meet", DuracionMinutos = 30 };
        var visita = new AccionActividad { Nombre = "Visita presencial", Descripcion = "Reunión en las oficinas del prospecto", DuracionMinutos = 90 };
        var demo = new AccionActividad { Nombre = "Demostración", Descripcion = "Demostración del producto", DuracionMinutos = 60 };
        var correo = new AccionActividad { Nombre = "Correo", Descripcion = "Envío de información o propuesta", DuracionMinutos = 10 };
        db.AccionesActividades.AddRange(llamada, videollamada, visita, demo, correo);

        // ---------- Empleados ----------
        var ana = new Empleado { Nombre = "Ana", Apellidos = "López Ruiz", Correo = "ana.lopez@ejemplo.com", Telefono = "5512345678", Puesto = gerente, UnidadNegocio = corporativo, ColorAgenda = "#8b5cf6" };
        var carlos = new Empleado { Nombre = "Carlos", Apellidos = "Méndez Soto", Correo = "carlos.mendez@ejemplo.com", Telefono = "5523456789", Puesto = ejecutivo, UnidadNegocio = pymes, ColorAgenda = "#0ea5e9" };
        var sofia = new Empleado { Nombre = "Sofía", Apellidos = "Ramírez Vega", Correo = "sofia.ramirez@ejemplo.com", Telefono = "5534567890", Puesto = ejecutivo, UnidadNegocio = corporativo, ColorAgenda = "#f59e0b" };
        db.Empleados.AddRange(ana, carlos, sofia);

        // ---------- Productos ----------
        var licencia = new Producto { Codigo = "LIC-BAS", Nombre = "Licencia básica (anual)", Tipo = TipoProducto.Producto, Precio = 12000 };
        var licenciaPro = new Producto { Codigo = "LIC-PRO", Nombre = "Licencia profesional (anual)", Tipo = TipoProducto.Producto, Precio = 24000 };
        var implementacion = new Producto { Codigo = "SRV-IMP", Nombre = "Implementación", Tipo = TipoProducto.Servicio, Precio = 15000 };
        var capacitacion = new Producto { Codigo = "SRV-CAP", Nombre = "Capacitación (por sesión)", Tipo = TipoProducto.Servicio, Precio = 3500 };
        var soporteAnual = new Producto { Codigo = "SRV-SOP", Nombre = "Soporte premium (anual)", Tipo = TipoProducto.Servicio, Precio = 8000 };
        db.Productos.AddRange(licencia, licenciaPro, implementacion, capacitacion, soporteAnual);

        // ---------- Clientes ----------
        var clienteAcme = new Cliente { RazonSocial = "Distribuidora Acme S.A. de C.V.", NombreComercial = "Acme", Rfc = "DAC010101AB1", ContactoPrincipal = "Jorge Pérez", Telefono = "5540001111", Correo = "compras@acme.ejemplo.com", Direccion = "Av. Reforma 100, CDMX" };
        var clienteNorte = new Cliente { RazonSocial = "Grupo Industrial del Norte S.A. de C.V.", NombreComercial = "GIN", Rfc = "GIN050505XY2", ContactoPrincipal = "Laura Garza", Telefono = "8180002222", Correo = "lgarza@gin.ejemplo.com", Direccion = "Monterrey, N.L." };
        db.Clientes.AddRange(clienteAcme, clienteNorte);

        // ---------- Prospectos ----------
        var p1 = new Prospecto { Nombre = "Roberto", Apellidos = "Hernández", Empresa = "Logística Express", Cargo = "Director de operaciones", Telefono = "5551112233", Correo = "roberto@logexpress.ejemplo.com", Origen = "Sitio web", Etapa = EtapaProspecto.Nuevo, ValorEstimado = 45000, EmpleadoResponsable = carlos, UnidadNegocio = pymes };
        var p2 = new Prospecto { Nombre = "Mariana", Apellidos = "Torres", Empresa = "Clínica San Ángel", Cargo = "Administradora", Telefono = "5552223344", Correo = "mtorres@sanangel.ejemplo.com", Origen = "Recomendación", Etapa = EtapaProspecto.Contactado, ValorEstimado = 60000, EmpleadoResponsable = sofia, UnidadNegocio = corporativo };
        var p3 = new Prospecto { Nombre = "Fernando", Apellidos = "Castillo", Empresa = "Constructora Castillo", Cargo = "Gerente general", Telefono = "5553334455", Correo = "fcastillo@ccastillo.ejemplo.com", Origen = "Evento", Etapa = EtapaProspecto.Calificado, ValorEstimado = 120000, EmpleadoResponsable = ana, UnidadNegocio = corporativo };
        var p4 = new Prospecto { Nombre = "Lucía", Apellidos = "Navarro", Empresa = "Boutique Lucía", Cargo = "Dueña", Telefono = "5554445566", Correo = "lucia@boutique.ejemplo.com", Origen = "Redes sociales", Etapa = EtapaProspecto.Propuesta, ValorEstimado = 27000, EmpleadoResponsable = carlos, UnidadNegocio = pymes };
        var p5 = new Prospecto { Nombre = "Diego", Apellidos = "Morales", Empresa = "Transportes Morales", Cargo = "Director", Telefono = "5555556677", Correo = "dmorales@tmorales.ejemplo.com", Origen = "Llamada en frío", Etapa = EtapaProspecto.Negociacion, ValorEstimado = 85000, EmpleadoResponsable = sofia, UnidadNegocio = corporativo };
        var p6 = new Prospecto { Nombre = "Patricia", Apellidos = "Ortiz", Empresa = "Farmacias Ortiz", Cargo = "Compras", Telefono = "5556667788", Correo = "portiz@fortiz.ejemplo.com", Origen = "Sitio web", Etapa = EtapaProspecto.Nuevo, ValorEstimado = 30000, EmpleadoResponsable = carlos, UnidadNegocio = pymes };
        var p7 = new Prospecto { Nombre = "Jorge", Apellidos = "Pérez", Empresa = "Distribuidora Acme", Cargo = "Compras", Telefono = "5540001111", Correo = "compras@acme.ejemplo.com", Origen = "Recomendación", Etapa = EtapaProspecto.Ganado, ValorEstimado = 51000, EmpleadoResponsable = ana, UnidadNegocio = corporativo, Cliente = clienteAcme };
        var p8 = new Prospecto { Nombre = "Ricardo", Apellidos = "Salinas", Empresa = "Hotel Mirador", Cargo = "Gerente", Telefono = "5557778899", Origen = "Evento", Etapa = EtapaProspecto.Perdido, ValorEstimado = 40000, EmpleadoResponsable = sofia, UnidadNegocio = pymes, Notas = "Eligió a la competencia por precio." };
        db.Prospectos.AddRange(p1, p2, p3, p4, p5, p6, p7, p8);

        // ---------- Bitácora ----------
        var hoy = DateTime.Today;
        db.Bitacora.AddRange(
            new BitacoraEntrada { Prospecto = p2, Empleado = sofia, AccionActividad = llamada, Fecha = hoy.AddDays(-3).AddHours(11), Descripcion = "Primer contacto. Interesada en digitalizar la agenda de la clínica." },
            new BitacoraEntrada { Prospecto = p3, Empleado = ana, AccionActividad = videollamada, Fecha = hoy.AddDays(-5).AddHours(10), Descripcion = "Levantamiento de necesidades: 40 usuarios, 3 sucursales." },
            new BitacoraEntrada { Prospecto = p3, Empleado = ana, AccionActividad = correo, Fecha = hoy.AddDays(-2).AddHours(16), Descripcion = "Se envió información de la licencia profesional." },
            new BitacoraEntrada { Prospecto = p4, Empleado = carlos, AccionActividad = demo, Fecha = hoy.AddDays(-1).AddHours(13), Descripcion = "Demostración realizada. Pidió cotización con capacitación." },
            new BitacoraEntrada { Prospecto = p5, Empleado = sofia, AccionActividad = visita, Fecha = hoy.AddDays(-4).AddHours(12), Descripcion = "Revisión de propuesta con el director. Solicita 10% de descuento." });

        // ---------- Citas ----------
        db.Citas.AddRange(
            new Cita { Prospecto = p1, Empleado = carlos, AccionActividad = llamada, FechaHoraInicio = hoy.AddHours(10), DuracionMinutos = 15, Estatus = EstatusCita.Confirmada, Notas = "Presentación inicial" },
            new Cita { Prospecto = p3, Empleado = ana, AccionActividad = demo, FechaHoraInicio = hoy.AddHours(12), DuracionMinutos = 60, Estatus = EstatusCita.Programada },
            new Cita { Prospecto = p5, Empleado = sofia, AccionActividad = videollamada, FechaHoraInicio = hoy.AddHours(17), DuracionMinutos = 30, Estatus = EstatusCita.Programada, Notas = "Cerrar condiciones de descuento" },
            new Cita { Prospecto = p2, Empleado = sofia, AccionActividad = visita, FechaHoraInicio = hoy.AddDays(1).AddHours(11), DuracionMinutos = 90, Estatus = EstatusCita.Programada },
            new Cita { Prospecto = p6, Empleado = carlos, AccionActividad = llamada, FechaHoraInicio = hoy.AddDays(2).AddHours(9).AddMinutes(30), DuracionMinutos = 15, Estatus = EstatusCita.Programada },
            new Cita { Prospecto = p4, Empleado = carlos, AccionActividad = demo, FechaHoraInicio = hoy.AddDays(-1).AddHours(13), DuracionMinutos = 60, Estatus = EstatusCita.Realizada });

        await db.SaveChangesAsync(ct);

        // ---------- Cotizaciones ----------
        db.Cotizaciones.AddRange(
            NuevaCotizacion(1, p4, null, carlos, EstatusCotizacion.Enviada, hoy.AddDays(-1),
                (licencia, 1, 0), (capacitacion, 2, 0)),
            NuevaCotizacion(2, p5, null, sofia, EstatusCotizacion.Borrador, hoy,
                (licenciaPro, 2, 10), (implementacion, 1, 10), (soporteAnual, 1, 0)),
            NuevaCotizacion(3, p7, clienteAcme, ana, EstatusCotizacion.Aceptada, hoy.AddDays(-10),
                (licenciaPro, 1, 0), (implementacion, 1, 0), (capacitacion, 3, 0)));

        // ---------- Roles ----------
        var admin = new Rol { Nombre = "Administrador", Descripcion = "Acceso total, incluida la seguridad.", EsAdministrador = true };
        var gerenteRol = new Rol
        {
            Nombre = "Gerente comercial",
            Descripcion = "Todo lo comercial y catálogos; sin administrar usuarios.",
            Permisos = Permisos.Todos.Where(p => !p.StartsWith("usuarios.") && !p.StartsWith("roles.")).ToList()
        };
        var vendedorRol = new Rol
        {
            Nombre = "Vendedor",
            Descripcion = "Da seguimiento a prospectos, agenda citas y cotiza. Solo consulta catálogos.",
            Permisos =
            [
                "prospectos.ver", "prospectos.editar",
                "citas.ver", "citas.editar", "citas.eliminar",
                "cotizaciones.ver", "cotizaciones.editar",
                "clientes.ver", "productos.ver", "empleados.ver", "catalogos.ver",
            ]
        };
        db.Roles.AddRange(admin, gerenteRol, vendedorRol);
        await db.SaveChangesAsync(ct);

        // ---------- Usuarios ----------
        await CrearUsuarioAsync(cuenta.Id, "Administrador Demo", UsuariosDemo.AdminCorreo, UsuariosDemo.AdminPassword, admin, ana);
        await CrearUsuarioAsync(cuenta.Id, "Carlos Méndez", UsuariosDemo.VendedorCorreo, UsuariosDemo.VendedorPassword, vendedorRol, carlos);
    }

    /// <summary>Segunda empresa con pocos datos: sirve para probar el aislamiento entre cuentas.</summary>
    private async Task CargarSegundaCuentaAsync(CancellationToken ct)
    {
        var cuenta = new Cuenta { Nombre = "Otra Empresa S.A.", FechaCreacion = DateTime.Now };
        db.Cuentas.Add(cuenta);
        await db.SaveChangesAsync(ct);
        db.UsarCuenta(cuenta.Id);

        var admin = new Rol { Nombre = "Administrador", EsAdministrador = true };
        var empleado = new Empleado { Nombre = "Laura", Apellidos = "Gómez", ColorAgenda = "#10b981" };
        db.Roles.Add(admin);
        db.Empleados.Add(empleado);
        // Mismo código de producto que en la otra cuenta: los índices únicos son por empresa.
        db.Productos.Add(new Producto { Codigo = "LIC-BAS", Nombre = "Licencia de otra empresa", Precio = 999 });
        db.Prospectos.Add(new Prospecto { Nombre = "Prospecto", Apellidos = "De Otra Empresa", Empresa = "No debe verse en la demo", EmpleadoResponsable = empleado });
        await db.SaveChangesAsync(ct);

        await CrearUsuarioAsync(cuenta.Id, "Admin Otra Empresa", UsuariosDemo.OtraEmpresaCorreo, UsuariosDemo.OtraEmpresaPassword, admin, empleado);
    }

    private async Task CrearUsuarioAsync(int cuentaId, string nombre, string correo, string password, Rol rol, Empleado? empleado)
    {
        var usuario = new Usuario
        {
            CuentaId = cuentaId,
            Nombre = nombre,
            Email = correo,
            UserName = correo,
            EmailConfirmed = true,
            LockoutEnabled = true,
            RolId = rol.Id,
            EmpleadoId = empleado?.Id,
            FechaCreacion = DateTime.Now,
        };
        var resultado = await usuarios.CreateAsync(usuario, password);
        if (!resultado.Succeeded)
            throw new InvalidOperationException(
                $"No se pudo crear el usuario demo {correo}: {string.Join(" ", resultado.Errors.Select(e => e.Description))}");
    }

    private static Cotizacion NuevaCotizacion(
        int consecutivo, Prospecto? prospecto, Cliente? cliente, Empleado empleado, EstatusCotizacion estatus, DateTime fecha,
        params (Producto producto, decimal cantidad, decimal descuento)[] partidas)
    {
        var cotizacion = new Cotizacion
        {
            Consecutivo = consecutivo,
            Folio = $"COT-{consecutivo:D5}",
            Prospecto = prospecto,
            Cliente = cliente,
            Empleado = empleado,
            Estatus = estatus,
            Fecha = DateOnly.FromDateTime(fecha),
            VigenciaDias = 15
        };

        foreach (var (producto, cantidad, descuento) in partidas)
        {
            cotizacion.Partidas.Add(new CotizacionPartida
            {
                Producto = producto,
                Descripcion = producto.Nombre,
                Cantidad = cantidad,
                PrecioUnitario = producto.Precio,
                DescuentoPorcentaje = descuento
            });
        }

        cotizacion.RecalcularTotales();
        return cotizacion;
    }
}
