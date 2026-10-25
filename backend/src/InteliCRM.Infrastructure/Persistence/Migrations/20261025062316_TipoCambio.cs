using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TipoCambio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TiposCambio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Fecha = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Valor = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Fuente = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiposCambio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TiposCambio_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TiposCambio_CuentaId",
                table: "TiposCambio",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_TiposCambio_CuentaId_Fecha",
                table: "TiposCambio",
                columns: new[] { "CuentaId", "Fecha" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TiposCambio");
        }
    }
}
