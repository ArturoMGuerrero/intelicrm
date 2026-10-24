using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeguimientoProspectosYCitas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Calle",
                table: "Prospectos",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ciudad",
                table: "Prospectos",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoPostal",
                table: "Prospectos",
                type: "TEXT",
                maxLength: 5,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Colonia",
                table: "Prospectos",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Prospectos",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "FechaNacimiento",
                table: "Prospectos",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Rfc",
                table: "Prospectos",
                type: "TEXT",
                maxLength: 13,
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ProspectoId",
                table: "Citas",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<int>(
                name: "ClienteId",
                table: "Citas",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Lugar",
                table: "Citas",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AvisoAtendido",
                table: "Bitacora",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAviso",
                table: "Bitacora",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Citas_ClienteId",
                table: "Citas",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Bitacora_AvisoAtendido_FechaAviso",
                table: "Bitacora",
                columns: new[] { "AvisoAtendido", "FechaAviso" });

            migrationBuilder.AddForeignKey(
                name: "FK_Citas_Clientes_ClienteId",
                table: "Citas",
                column: "ClienteId",
                principalTable: "Clientes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Citas_Clientes_ClienteId",
                table: "Citas");

            migrationBuilder.DropIndex(
                name: "IX_Citas_ClienteId",
                table: "Citas");

            migrationBuilder.DropIndex(
                name: "IX_Bitacora_AvisoAtendido_FechaAviso",
                table: "Bitacora");

            migrationBuilder.DropColumn(
                name: "Calle",
                table: "Prospectos");

            migrationBuilder.DropColumn(
                name: "Ciudad",
                table: "Prospectos");

            migrationBuilder.DropColumn(
                name: "CodigoPostal",
                table: "Prospectos");

            migrationBuilder.DropColumn(
                name: "Colonia",
                table: "Prospectos");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Prospectos");

            migrationBuilder.DropColumn(
                name: "FechaNacimiento",
                table: "Prospectos");

            migrationBuilder.DropColumn(
                name: "Rfc",
                table: "Prospectos");

            migrationBuilder.DropColumn(
                name: "ClienteId",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "Lugar",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "AvisoAtendido",
                table: "Bitacora");

            migrationBuilder.DropColumn(
                name: "FechaAviso",
                table: "Bitacora");

            migrationBuilder.AlterColumn<int>(
                name: "ProspectoId",
                table: "Citas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);
        }
    }
}
