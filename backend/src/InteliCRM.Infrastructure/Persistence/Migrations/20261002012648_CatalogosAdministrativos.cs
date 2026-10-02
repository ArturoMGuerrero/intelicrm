using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CatalogosAdministrativos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CondicionesPago",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DiasCredito = table.Column<int>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CondicionesPago", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CondicionesPago_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DescripcionesServicio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DescripcionesServicio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DescripcionesServicio_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InstrumentosPago",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstrumentosPago", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InstrumentosPago_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Sucursales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Direccion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CodigoPostal = table.Column<string>(type: "TEXT", maxLength: 5, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sucursales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sucursales_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TiposContacto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposContacto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TiposContacto_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Almacenes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Ubicacion = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    SucursalId = table.Column<int>(type: "INTEGER", nullable: false),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Almacenes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Almacenes_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Almacenes_Sucursales_SucursalId",
                        column: x => x.SucursalId,
                        principalTable: "Sucursales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Proveedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RazonSocial = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    NombreComercial = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Rfc = table.Column<string>(type: "TEXT", maxLength: 13, nullable: true),
                    TipoPersona = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Correo = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    Direccion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ContactoNombre = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    ContactoTelefono = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    ContactoCorreo = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    TipoContactoId = table.Column<int>(type: "INTEGER", nullable: true),
                    CondicionPagoId = table.Column<int>(type: "INTEGER", nullable: true),
                    InstrumentoPagoId = table.Column<int>(type: "INTEGER", nullable: true),
                    Banco = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    NumeroCuenta = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    Clabe = table.Column<string>(type: "TEXT", maxLength: 18, nullable: true),
                    Notas = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proveedores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Proveedores_CondicionesPago_CondicionPagoId",
                        column: x => x.CondicionPagoId,
                        principalTable: "CondicionesPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Proveedores_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Proveedores_InstrumentosPago_InstrumentoPagoId",
                        column: x => x.InstrumentoPagoId,
                        principalTable: "InstrumentosPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Proveedores_TiposContacto_TipoContactoId",
                        column: x => x.TipoContactoId,
                        principalTable: "TiposContacto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_CuentaId",
                table: "Almacenes",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_Almacenes_SucursalId_Nombre",
                table: "Almacenes",
                columns: new[] { "SucursalId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CondicionesPago_CuentaId",
                table: "CondicionesPago",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_CondicionesPago_CuentaId_Nombre",
                table: "CondicionesPago",
                columns: new[] { "CuentaId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DescripcionesServicio_CuentaId",
                table: "DescripcionesServicio",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_DescripcionesServicio_CuentaId_Nombre",
                table: "DescripcionesServicio",
                columns: new[] { "CuentaId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InstrumentosPago_CuentaId",
                table: "InstrumentosPago",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_InstrumentosPago_CuentaId_Nombre",
                table: "InstrumentosPago",
                columns: new[] { "CuentaId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_CondicionPagoId",
                table: "Proveedores",
                column: "CondicionPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_CuentaId",
                table: "Proveedores",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_CuentaId_Rfc",
                table: "Proveedores",
                columns: new[] { "CuentaId", "Rfc" },
                unique: true,
                filter: "[Rfc] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_InstrumentoPagoId",
                table: "Proveedores",
                column: "InstrumentoPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_Proveedores_TipoContactoId",
                table: "Proveedores",
                column: "TipoContactoId");

            migrationBuilder.CreateIndex(
                name: "IX_Sucursales_CuentaId",
                table: "Sucursales",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_Sucursales_CuentaId_Nombre",
                table: "Sucursales",
                columns: new[] { "CuentaId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TiposContacto_CuentaId",
                table: "TiposContacto",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_TiposContacto_CuentaId_Nombre",
                table: "TiposContacto",
                columns: new[] { "CuentaId", "Nombre" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Almacenes");

            migrationBuilder.DropTable(
                name: "DescripcionesServicio");

            migrationBuilder.DropTable(
                name: "Proveedores");

            migrationBuilder.DropTable(
                name: "Sucursales");

            migrationBuilder.DropTable(
                name: "CondicionesPago");

            migrationBuilder.DropTable(
                name: "InstrumentosPago");

            migrationBuilder.DropTable(
                name: "TiposContacto");
        }
    }
}
