using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ComprasInventario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Costo",
                table: "Productos",
                type: "TEXT",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ProveedorId",
                table: "Productos",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "StockMinimo",
                table: "Productos",
                type: "TEXT",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrdenCompraId",
                table: "CuentasPorPagar",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AlmacenId",
                table: "Cargos",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Existencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: false),
                    AlmacenId = table.Column<int>(type: "INTEGER", nullable: false),
                    Cantidad = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    CostoPromedio = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Existencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Existencias_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Existencias_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Existencias_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovimientosInventario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Fecha = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: false),
                    AlmacenId = table.Column<int>(type: "INTEGER", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Cantidad = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    ExistenciaAnterior = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    ExistenciaNueva = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    CostoUnitario = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Referencia = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    Notas = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimientosInventario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimientosInventario_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimientosInventario_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimientosInventario_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrdenesCompra",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Consecutivo = table.Column<int>(type: "INTEGER", nullable: false),
                    Folio = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ProveedorId = table.Column<int>(type: "INTEGER", nullable: false),
                    AlmacenId = table.Column<int>(type: "INTEGER", nullable: false),
                    Fecha = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    FechaEntregaEstimada = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    CondicionPagoId = table.Column<int>(type: "INTEGER", nullable: true),
                    DiasCredito = table.Column<int>(type: "INTEGER", nullable: false),
                    Notas = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Estatus = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    MotivoCancelacion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Subtotal = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Iva = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenesCompra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenesCompra_Almacenes_AlmacenId",
                        column: x => x.AlmacenId,
                        principalTable: "Almacenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesCompra_CondicionesPago_CondicionPagoId",
                        column: x => x.CondicionPagoId,
                        principalTable: "CondicionesPago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesCompra_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesCompra_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrdenCompraPartidas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OrdenCompraId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: false),
                    Descripcion = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Cantidad = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    CantidadRecibida = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    CostoUnitario = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenCompraPartidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenCompraPartidas_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenCompraPartidas_OrdenesCompra_OrdenCompraId",
                        column: x => x.OrdenCompraId,
                        principalTable: "OrdenesCompra",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrdenCompraPartidas_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Productos_ProveedorId",
                table: "Productos",
                column: "ProveedorId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentasPorPagar_OrdenCompraId",
                table: "CuentasPorPagar",
                column: "OrdenCompraId");

            migrationBuilder.CreateIndex(
                name: "IX_Cargos_AlmacenId",
                table: "Cargos",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_Existencias_AlmacenId",
                table: "Existencias",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_Existencias_CuentaId",
                table: "Existencias",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_Existencias_ProductoId_AlmacenId",
                table: "Existencias",
                columns: new[] { "ProductoId", "AlmacenId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_AlmacenId",
                table: "MovimientosInventario",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_CuentaId",
                table: "MovimientosInventario",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientosInventario_ProductoId_AlmacenId_Fecha",
                table: "MovimientosInventario",
                columns: new[] { "ProductoId", "AlmacenId", "Fecha" });

            migrationBuilder.CreateIndex(
                name: "IX_OrdenCompraPartidas_CuentaId",
                table: "OrdenCompraPartidas",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenCompraPartidas_OrdenCompraId",
                table: "OrdenCompraPartidas",
                column: "OrdenCompraId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenCompraPartidas_ProductoId",
                table: "OrdenCompraPartidas",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_AlmacenId",
                table: "OrdenesCompra",
                column: "AlmacenId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_CondicionPagoId",
                table: "OrdenesCompra",
                column: "CondicionPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_CuentaId",
                table: "OrdenesCompra",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_CuentaId_Consecutivo",
                table: "OrdenesCompra",
                columns: new[] { "CuentaId", "Consecutivo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_CuentaId_Folio",
                table: "OrdenesCompra",
                columns: new[] { "CuentaId", "Folio" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCompra_ProveedorId",
                table: "OrdenesCompra",
                column: "ProveedorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cargos_Almacenes_AlmacenId",
                table: "Cargos",
                column: "AlmacenId",
                principalTable: "Almacenes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CuentasPorPagar_OrdenesCompra_OrdenCompraId",
                table: "CuentasPorPagar",
                column: "OrdenCompraId",
                principalTable: "OrdenesCompra",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_Proveedores_ProveedorId",
                table: "Productos",
                column: "ProveedorId",
                principalTable: "Proveedores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cargos_Almacenes_AlmacenId",
                table: "Cargos");

            migrationBuilder.DropForeignKey(
                name: "FK_CuentasPorPagar_OrdenesCompra_OrdenCompraId",
                table: "CuentasPorPagar");

            migrationBuilder.DropForeignKey(
                name: "FK_Productos_Proveedores_ProveedorId",
                table: "Productos");

            migrationBuilder.DropTable(
                name: "Existencias");

            migrationBuilder.DropTable(
                name: "MovimientosInventario");

            migrationBuilder.DropTable(
                name: "OrdenCompraPartidas");

            migrationBuilder.DropTable(
                name: "OrdenesCompra");

            migrationBuilder.DropIndex(
                name: "IX_Productos_ProveedorId",
                table: "Productos");

            migrationBuilder.DropIndex(
                name: "IX_CuentasPorPagar_OrdenCompraId",
                table: "CuentasPorPagar");

            migrationBuilder.DropIndex(
                name: "IX_Cargos_AlmacenId",
                table: "Cargos");

            migrationBuilder.DropColumn(
                name: "Costo",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "ProveedorId",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "StockMinimo",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "OrdenCompraId",
                table: "CuentasPorPagar");

            migrationBuilder.DropColumn(
                name: "AlmacenId",
                table: "Cargos");
        }
    }
}
