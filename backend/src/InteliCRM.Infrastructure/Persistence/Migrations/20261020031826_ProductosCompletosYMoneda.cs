using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProductosCompletosYMoneda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CantidadMayoreo",
                table: "Productos",
                type: "TEXT",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CategoriaId",
                table: "Productos",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoAlterno",
                table: "Productos",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoBarras",
                table: "Productos",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Imagen",
                table: "Productos",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PrecioMayoreo",
                table: "Productos",
                type: "TEXT",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Presentacion",
                table: "Productos",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ubicacion",
                table: "Productos",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnidadMedida",
                table: "Productos",
                type: "TEXT",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Atencion",
                table: "Cotizaciones",
                type: "TEXT",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Moneda",
                table: "Cotizaciones",
                type: "TEXT",
                maxLength: 3,
                nullable: false,
                defaultValue: "MXN");

            migrationBuilder.AddColumn<decimal>(
                name: "TipoCambio",
                table: "Cotizaciones",
                type: "TEXT",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CategoriasProducto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NombreCorto = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    MargenPorcentaje = table.Column<decimal>(type: "TEXT", precision: 9, scale: 2, nullable: true),
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
                    table.PrimaryKey("PK_CategoriasProducto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoriasProducto_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductosProveedores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProductoId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProveedorId = table.Column<int>(type: "INTEGER", nullable: false),
                    CodigoProveedor = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Costo = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductosProveedores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductosProveedores_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductosProveedores_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductosProveedores_Proveedores_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "Proveedores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Productos_CategoriaId",
                table: "Productos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Productos_CuentaId_CodigoBarras",
                table: "Productos",
                columns: new[] { "CuentaId", "CodigoBarras" },
                unique: true,
                filter: "[CodigoBarras] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CategoriasProducto_CuentaId",
                table: "CategoriasProducto",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_CategoriasProducto_CuentaId_Nombre",
                table: "CategoriasProducto",
                columns: new[] { "CuentaId", "Nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductosProveedores_CuentaId",
                table: "ProductosProveedores",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductosProveedores_ProductoId_ProveedorId",
                table: "ProductosProveedores",
                columns: new[] { "ProductoId", "ProveedorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductosProveedores_ProveedorId",
                table: "ProductosProveedores",
                column: "ProveedorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_CategoriasProducto_CategoriaId",
                table: "Productos",
                column: "CategoriaId",
                principalTable: "CategoriasProducto",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Productos_CategoriasProducto_CategoriaId",
                table: "Productos");

            migrationBuilder.DropTable(
                name: "CategoriasProducto");

            migrationBuilder.DropTable(
                name: "ProductosProveedores");

            migrationBuilder.DropIndex(
                name: "IX_Productos_CategoriaId",
                table: "Productos");

            migrationBuilder.DropIndex(
                name: "IX_Productos_CuentaId_CodigoBarras",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "CantidadMayoreo",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "CategoriaId",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "CodigoAlterno",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "CodigoBarras",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Imagen",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "PrecioMayoreo",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Presentacion",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Ubicacion",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "UnidadMedida",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Atencion",
                table: "Cotizaciones");

            migrationBuilder.DropColumn(
                name: "Moneda",
                table: "Cotizaciones");

            migrationBuilder.DropColumn(
                name: "TipoCambio",
                table: "Cotizaciones");
        }
    }
}
