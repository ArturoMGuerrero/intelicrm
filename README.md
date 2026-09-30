# InteliCRM v2

Nueva versión de InteliCRM: backend en **ASP.NET Core (.NET 10) + EF Core** y frontend en **React + TypeScript + Tailwind**.

> En desarrollo usa **SQLite** (archivo `backend/src/InteliCRM.Api/intelicrm.db`); se crea solo al arrancar,
> con datos de ejemplo la primera vez. Para empezar de cero, detén el backend y borra los archivos `intelicrm.db*`.

## Estructura

```
backend/                     Solución .NET (InteliCRM.slnx)
  src/InteliCRM.Domain          Entidades y enums (sin dependencias)
  src/InteliCRM.Application     Servicios, DTOs, validaciones y reglas de negocio
  src/InteliCRM.Infrastructure  EF Core: DbContext, configuración de tablas, datos demo
  src/InteliCRM.Api             Controladores REST, manejo de errores, Program.cs
frontend/                    React 19 + Vite + TypeScript + Tailwind + TanStack Query
```

## Módulos

| Sistema actual (Web Forms)      | Nuevo                    | API                          |
|---------------------------------|--------------------------|------------------------------|
| Pacientes → "Prospectos"        | Prospectos + embudo      | `/api/prospectos`            |
| Expediente clínico → "Bitácora" | Bitácora del prospecto   | `/api/prospectos/{id}/bitacora` |
| Citas                           | Agenda diaria            | `/api/citas`                 |
| Cotización                      | Cotizaciones con partidas e IVA | `/api/cotizaciones`   |
| Clientes                        | Clientes                 | `/api/clientes`              |
| Artículos                       | Productos y servicios    | `/api/productos`             |
| Empleados / Especialistas       | Empleados                | `/api/empleados`             |
| Especialidades → "Puestos"      | Puestos                  | `/api/puestos`               |
| Unidades → "Unidades de negocio"| Unidades de negocio      | `/api/unidades-negocio`      |
| Tratamientos → "Acciones y actividades" | Acciones y actividades | `/api/acciones-actividades` |

Reglas de negocio incluidas: un empleado no puede tener citas traslapadas, folios consecutivos
de cotización, cálculo de IVA 16 %, conversión de prospecto a cliente, bajas lógicas y registro
automático en la bitácora al cambiar de etapa o de estatus de cotización.

## Seguridad: usuarios, roles y multi-cuenta

- **Login** con correo y contraseña (ASP.NET Core Identity): contraseñas con hash, mínimo 8 caracteres con
  mayúscula, minúscula y número; bloqueo de 15 min tras 5 intentos fallidos; máximo 10 intentos de login por minuto por IP.
- **Token JWT** de 8 horas. Si a un usuario se le desactiva o se le cambian el rol o los permisos, su token deja de valer de inmediato.
- **Roles por empresa** con permisos `modulo.ver`, `modulo.editar` y `modulo.eliminar` (catálogo en
  `backend/src/InteliCRM.Domain/Seguridad/Permisos.cs`). El rol administrador tiene todos.
- **Multi-cuenta**: cada registro tiene `CuentaId` y EF Core filtra automáticamente por la empresa del usuario
  (ver `AppDbContext`). El cliente nunca decide la cuenta.
- **Auditoría**: cada registro guarda quién y cuándo lo creó y lo modificó.

### Usuarios de prueba

Los crea `DatosDemo` al generar la base (solo en desarrollo). Correos y contraseñas en la clase `UsuariosDemo`
de `backend/src/InteliCRM.Infrastructure/Persistence/DatosDemo.cs`:

| Usuario | Empresa | Rol |
|---|---|---|
| `AdminCorreo` | Comercializadora Demo | Administrador |
| `VendedorCorreo` | Comercializadora Demo | Vendedor (sin catálogos ni seguridad) |
| `OtraEmpresaCorreo` | Otra Empresa S.A. | Administrador (para probar el aislamiento entre empresas) |

## Frontend: kit de componentes

Todas las pantallas se arman con los componentes de `frontend/src/components/ui/` (Boton, Input, Select,
Campo, Tabla, Tarjeta, Modal, Insignia, Buscador, etc.), estilizados **solo con clases de Tailwind**.
`index.css` únicamente importa Tailwind y define los colores de la marca.

- Mensajes flotantes (toasts) con `sonner` mediante `notificar.exito()` / `notificar.error()`.
- Confirmaciones con `useConfirmar()` (en lugar de `window.confirm`).
- Permisos en la UI con `useSesion().puede('clientes.editar')` o `<SiPuede permiso="...">`.
  Ocultar un botón es solo comodidad: la API valida siempre el permiso.

## Cómo ejecutarlo

Requisitos: .NET SDK 10 y Node.js 22 LTS o superior.

**Clave de los tokens (JWT):** en desarrollo no hay que hacer nada; la primera vez el backend genera una
clave aleatoria en `backend/src/InteliCRM.Api/jwt-desarrollo.key` (excluida de Git). En producción es obligatorio
configurar `Jwt:Clave` (32+ caracteres) como variable de entorno o en Azure Key Vault.

**1. Backend** (http://localhost:5205, documentación interactiva en http://localhost:5205/scalar/v1)

```bash
cd backend
dotnet run --project src/InteliCRM.Api
```

**2. Frontend** (http://localhost:5173), en otra terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend redirige `/api` al backend (ver `frontend/vite.config.ts`).

## Base de datos

`BaseDeDatos:Proveedor` en `appsettings.json` acepta `Sqlite` (actual), `SqlServer` o `InMemory`.
En desarrollo, las migraciones pendientes se aplican solas al arrancar.

Cambios al modelo (desde `backend/`, la herramienta `dotnet-ef` está en el manifiesto local):

```bash
dotnet tool restore
dotnet ef migrations add NombreDelCambio --project src/InteliCRM.Infrastructure --startup-project src/InteliCRM.Api --output-dir Persistence/Migrations
```

### Pasar a SQL Server / Azure SQL

1. Cambiar `"Proveedor": "SqlServer"` y poner la cadena de conexión con *user-secrets* (nunca en el repositorio):
   ```bash
   dotnet user-secrets --project src/InteliCRM.Api set "ConnectionStrings:InteliCRM" "Server=...;Database=InteliCRM;..."
   ```
2. Las migraciones de EF Core son específicas de cada proveedor: las actuales son de SQLite.
   Para SQL Server hay que generar un juego propio (lo recomendable es un proyecto de migraciones aparte
   por proveedor, p. ej. `InteliCRM.Migrations.SqlServer`).

Nota: en este equipo no se pudo instalar SQL Server LocalDB (el servicio *SQL Server VSS Writer* no arranca,
error 1920), por eso se usa SQLite para desarrollo.

## Pendientes

- PDF y envío por correo de cotizaciones; recordatorios de citas.
- Mensajes de validación de los atributos (`[Required]`, `[EmailAddress]`) en español.
- Paginación en listas grandes.
- Módulos restantes: Ventas, Compras, Inventarios, Cuentas por cobrar/pagar, Facturación.
- Alta de nuevas empresas (cuentas) desde una pantalla de super-administrador.
