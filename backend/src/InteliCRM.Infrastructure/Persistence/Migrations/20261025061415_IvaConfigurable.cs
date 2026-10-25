using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IvaConfigurable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TasaIva",
                table: "Productos",
                type: "TEXT",
                precision: 5,
                scale: 4,
                nullable: false,
                defaultValue: 0.16m);

            migrationBuilder.AddColumn<decimal>(
                name: "TasaIva",
                table: "OrdenCompraPartidas",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0.16m);

            migrationBuilder.AddColumn<decimal>(
                name: "TasaIva",
                table: "CotizacionPartidas",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0.16m);

            migrationBuilder.AddColumn<decimal>(
                name: "TasaIvaPredeterminada",
                table: "ConfiguracionEmpresa",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0.16m);

            migrationBuilder.AddColumn<decimal>(
                name: "TasaIva",
                table: "Clientes",
                type: "TEXT",
                precision: 5,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TasaIva",
                table: "CargoPartidas",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0.16m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TasaIva",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "TasaIva",
                table: "OrdenCompraPartidas");

            migrationBuilder.DropColumn(
                name: "TasaIva",
                table: "CotizacionPartidas");

            migrationBuilder.DropColumn(
                name: "TasaIvaPredeterminada",
                table: "ConfiguracionEmpresa");

            migrationBuilder.DropColumn(
                name: "TasaIva",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "TasaIva",
                table: "CargoPartidas");
        }
    }
}
