using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EmpresaHorariosListasPrecios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ListaPreciosId",
                table: "Clientes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConfiguracionEmpresa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RazonSocial = table.Column<string>(type: "TEXT", maxLength: 250, nullable: false),
                    NombreComercial = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Rfc = table.Column<string>(type: "TEXT", maxLength: 13, nullable: true),
                    RegimenFiscal = table.Column<string>(type: "TEXT", maxLength: 3, nullable: true),
                    CodigoPostal = table.Column<string>(type: "TEXT", maxLength: 5, nullable: true),
                    Direccion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Correo = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    SitioWeb = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Logo = table.Column<string>(type: "TEXT", nullable: true),
                    SerieFactura = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    PieDocumentos = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionEmpresa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConfiguracionEmpresa_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HorariosEmpleado",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EmpleadoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Dia = table.Column<int>(type: "INTEGER", nullable: false),
                    HoraInicio = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                    HoraFin = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorariosEmpleado", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HorariosEmpleado_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HorariosEmpleado_Empleados_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ListasPrecios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListasPrecios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ListasPrecios_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CuentasBancariasEmpresa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ConfiguracionEmpresaId = table.Column<int>(type: "INTEGER", nullable: false),
                    Banco = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    NumeroCuenta = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    Clabe = table.Column<string>(type: "TEXT", maxLength: 18, nullable: true),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuentasBancariasEmpresa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuentasBancariasEmpresa_ConfiguracionEmpresa_ConfiguracionEmpresaId",
                        column: x => x.ConfiguracionEmpresaId,
                        principalTable: "ConfiguracionEmpresa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CuentasBancariasEmpresa_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PreciosLista",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ListaPreciosId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Precio = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreciosLista", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreciosLista_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PreciosLista_ListasPrecios_ListaPreciosId",
                        column: x => x.ListaPreciosId,
                        principalTable: "ListasPrecios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PreciosLista_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_ListaPreciosId",
                table: "Clientes",
                column: "ListaPreciosId");

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionEmpresa_CuentaId",
                table: "ConfiguracionEmpresa",
                column: "CuentaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuentasBancariasEmpresa_ConfiguracionEmpresaId",
                table: "CuentasBancariasEmpresa",
                column: "ConfiguracionEmpresaId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasBancariasEmpresa_CuentaId",
                table: "CuentasBancariasEmpresa",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_HorariosEmpleado_CuentaId",
                table: "HorariosEmpleado",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_HorariosEmpleado_EmpleadoId_Dia",
                table: "HorariosEmpleado",
                columns: new[] { "EmpleadoId", "Dia" });

            migrationBuilder.CreateIndex(
                name: "IX_ListasPrecios_CuentaId",
                table: "ListasPrecios",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_ListasPrecios_CuentaId_Nombre",
                table: "ListasPrecios",
                columns: new[] { "CuentaId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PreciosLista_CuentaId",
                table: "PreciosLista",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_PreciosLista_ListaPreciosId_ProductoId",
                table: "PreciosLista",
                columns: new[] { "ListaPreciosId", "ProductoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PreciosLista_ProductoId",
                table: "PreciosLista",
                column: "ProductoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_ListasPrecios_ListaPreciosId",
                table: "Clientes",
                column: "ListaPreciosId",
                principalTable: "ListasPrecios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_ListasPrecios_ListaPreciosId",
                table: "Clientes");

            migrationBuilder.DropTable(
                name: "CuentasBancariasEmpresa");

            migrationBuilder.DropTable(
                name: "HorariosEmpleado");

            migrationBuilder.DropTable(
                name: "PreciosLista");

            migrationBuilder.DropTable(
                name: "ConfiguracionEmpresa");

            migrationBuilder.DropTable(
                name: "ListasPrecios");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_ListaPreciosId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "ListaPreciosId",
                table: "Clientes");
        }
    }
}
