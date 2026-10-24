using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ClientesCompletos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Banco",
                table: "Clientes",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Clabe",
                table: "Clientes",
                type: "TEXT",
                maxLength: 18,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CondicionPagoId",
                table: "Clientes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiasRevision",
                table: "Clientes",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "HoraRevisionDesde",
                table: "Clientes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "HoraRevisionHasta",
                table: "Clientes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstruccionesContrarecibo",
                table: "Clientes",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "InstrumentoPagoId",
                table: "Clientes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notas",
                table: "Clientes",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NumeroCuenta",
                table: "Clientes",
                type: "TEXT",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoPersona",
                table: "Clientes",
                type: "TEXT",
                maxLength: 10,
                nullable: false,
                defaultValue: "Moral");

            migrationBuilder.AddColumn<string>(
                name: "Zona",
                table: "Clientes",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContactosCliente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClienteId = table.Column<int>(type: "INTEGER", nullable: false),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Puesto = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    TipoContactoId = table.Column<int>(type: "INTEGER", nullable: true),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Extension = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    Celular = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Correo = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    Principal = table.Column<bool>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactosCliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactosCliente_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContactosCliente_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContactosCliente_TiposContacto_TipoContactoId",
                        column: x => x.TipoContactoId,
                        principalTable: "TiposContacto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DireccionesCliente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ClienteId = table.Column<int>(type: "INTEGER", nullable: false),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Calle = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    NumeroExterior = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    NumeroInterior = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Colonia = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CodigoPostal = table.Column<string>(type: "TEXT", maxLength: 5, nullable: true),
                    Municipio = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Estado = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Pais = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Instrucciones = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Principal = table.Column<bool>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DireccionesCliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DireccionesCliente_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DireccionesCliente_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_CondicionPagoId",
                table: "Clientes",
                column: "CondicionPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_InstrumentoPagoId",
                table: "Clientes",
                column: "InstrumentoPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactosCliente_ClienteId",
                table: "ContactosCliente",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactosCliente_CuentaId",
                table: "ContactosCliente",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactosCliente_TipoContactoId",
                table: "ContactosCliente",
                column: "TipoContactoId");

            migrationBuilder.CreateIndex(
                name: "IX_DireccionesCliente_ClienteId",
                table: "DireccionesCliente",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_DireccionesCliente_CuentaId",
                table: "DireccionesCliente",
                column: "CuentaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_CondicionesPago_CondicionPagoId",
                table: "Clientes",
                column: "CondicionPagoId",
                principalTable: "CondicionesPago",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_InstrumentosPago_InstrumentoPagoId",
                table: "Clientes",
                column: "InstrumentoPagoId",
                principalTable: "InstrumentosPago",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_CondicionesPago_CondicionPagoId",
                table: "Clientes");

            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_InstrumentosPago_InstrumentoPagoId",
                table: "Clientes");

            migrationBuilder.DropTable(
                name: "ContactosCliente");

            migrationBuilder.DropTable(
                name: "DireccionesCliente");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_CondicionPagoId",
                table: "Clientes");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_InstrumentoPagoId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Banco",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Clabe",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "CondicionPagoId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "DiasRevision",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "HoraRevisionDesde",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "HoraRevisionHasta",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "InstruccionesContrarecibo",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "InstrumentoPagoId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Notas",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "NumeroCuenta",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "TipoPersona",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Zona",
                table: "Clientes");
        }
    }
}
