using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Cobranza : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cargos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProspectoId = table.Column<int>(type: "INTEGER", nullable: true),
                    ClienteId = table.Column<int>(type: "INTEGER", nullable: true),
                    EmpleadoId = table.Column<int>(type: "INTEGER", nullable: true),
                    CotizacionId = table.Column<int>(type: "INTEGER", nullable: true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Consecutivo = table.Column<int>(type: "INTEGER", nullable: false),
                    Folio = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Fecha = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    DiasCredito = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaVencimiento = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    CondicionPagoId = table.Column<int>(type: "INTEGER", nullable: true),
                    Notas = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Estatus = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    MotivoCancelacion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Subtotal = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Iva = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Saldo = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cargos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cargos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cargos_CondicionesPago_CondicionPagoId",
                        column: x => x.CondicionPagoId,
                        principalTable: "CondicionesPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cargos_Cotizaciones_CotizacionId",
                        column: x => x.CotizacionId,
                        principalTable: "Cotizaciones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cargos_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cargos_Empleados_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cargos_Prospectos_ProspectoId",
                        column: x => x.ProspectoId,
                        principalTable: "Prospectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CuentasPorPagar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProveedorId = table.Column<int>(type: "INTEGER", nullable: false),
                    FolioProveedor = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Concepto = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Consecutivo = table.Column<int>(type: "INTEGER", nullable: false),
                    Folio = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Fecha = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    DiasCredito = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaVencimiento = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    CondicionPagoId = table.Column<int>(type: "INTEGER", nullable: true),
                    Notas = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Estatus = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    MotivoCancelacion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Subtotal = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Iva = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Saldo = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuentasPorPagar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuentasPorPagar_CondicionesPago_CondicionPagoId",
                        column: x => x.CondicionPagoId,
                        principalTable: "CondicionesPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CuentasPorPagar_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CuentasPorPagar_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CargoPartidas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CargoId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: true),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Cantidad = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    DescuentoPorcentaje = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CargoPartidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CargoPartidas_Cargos_CargoId",
                        column: x => x.CargoId,
                        principalTable: "Cargos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CargoPartidas_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CargoPartidas_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PagosCargo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CargoId = table.Column<int>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Fecha = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Monto = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    InstrumentoPagoId = table.Column<int>(type: "INTEGER", nullable: true),
                    Referencia = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Notas = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Cancelado = table.Column<bool>(type: "INTEGER", nullable: false),
                    FechaCancelacion = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PagosCargo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PagosCargo_Cargos_CargoId",
                        column: x => x.CargoId,
                        principalTable: "Cargos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PagosCargo_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PagosCargo_InstrumentosPago_InstrumentoPagoId",
                        column: x => x.InstrumentoPagoId,
                        principalTable: "InstrumentosPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PagosProveedor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CuentaPorPagarId = table.Column<int>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    Fecha = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Monto = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    InstrumentoPagoId = table.Column<int>(type: "INTEGER", nullable: true),
                    Referencia = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Notas = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Cancelado = table.Column<bool>(type: "INTEGER", nullable: false),
                    FechaCancelacion = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PagosProveedor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PagosProveedor_CuentasPorPagar_CuentaPorPagarId",
                        column: x => x.CuentaPorPagarId,
                        principalTable: "CuentasPorPagar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PagosProveedor_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PagosProveedor_InstrumentosPago_InstrumentoPagoId",
                        column: x => x.InstrumentoPagoId,
                        principalTable: "InstrumentosPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CargoPartidas_CargoId",
                table: "CargoPartidas",
                column: "CargoId");

            migrationBuilder.CreateIndex(
                name: "IX_CargoPartidas_CuentaId",
                table: "CargoPartidas",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_CargoPartidas_ProductoId",
                table: "CargoPartidas",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_ClienteId",
                table: "Cargos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_CondicionPagoId",
                table: "Cargos",
                column: "CondicionPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_CotizacionId",
                table: "Cargos",
                column: "CotizacionId");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_CuentaId",
                table: "Cargos",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_CuentaId_Consecutivo",
                table: "Cargos",
                columns: new[] { "CuentaId", "Consecutivo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_CuentaId_Folio",
                table: "Cargos",
                columns: new[] { "CuentaId", "Folio" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_EmpleadoId",
                table: "Cargos",
                column: "EmpleadoId");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_FechaVencimiento",
                table: "Cargos",
                column: "FechaVencimiento");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_ProspectoId",
                table: "Cargos",
                column: "ProspectoId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasPorPagar_CondicionPagoId",
                table: "CuentasPorPagar",
                column: "CondicionPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasPorPagar_CuentaId",
                table: "CuentasPorPagar",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasPorPagar_CuentaId_Consecutivo",
                table: "CuentasPorPagar",
                columns: new[] { "CuentaId", "Consecutivo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuentasPorPagar_CuentaId_Folio",
                table: "CuentasPorPagar",
                columns: new[] { "CuentaId", "Folio" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuentasPorPagar_FechaVencimiento",
                table: "CuentasPorPagar",
                column: "FechaVencimiento");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasPorPagar_ProveedorId",
                table: "CuentasPorPagar",
                column: "ProveedorId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosCargo_CargoId",
                table: "PagosCargo",
                column: "CargoId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosCargo_CuentaId",
                table: "PagosCargo",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosCargo_Fecha",
                table: "PagosCargo",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_PagosCargo_InstrumentoPagoId",
                table: "PagosCargo",
                column: "InstrumentoPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosProveedor_CuentaId",
                table: "PagosProveedor",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosProveedor_CuentaPorPagarId",
                table: "PagosProveedor",
                column: "CuentaPorPagarId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosProveedor_Fecha",
                table: "PagosProveedor",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_PagosProveedor_InstrumentoPagoId",
                table: "PagosProveedor",
                column: "InstrumentoPagoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CargoPartidas");

            migrationBuilder.DropTable(
                name: "PagosCargo");

            migrationBuilder.DropTable(
                name: "PagosProveedor");

            migrationBuilder.DropTable(
                name: "Cargos");

            migrationBuilder.DropTable(
                name: "CuentasPorPagar");
        }
    }
}
