using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InteliCRM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Mensajeria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Formatos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Categoria = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    NombreArchivo = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    TipoContenido = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Tamano = table.Column<long>(type: "INTEGER", nullable: false),
                    Contenido = table.Column<byte[]>(type: "BLOB", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Formatos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Formatos_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MensajesEnviados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Fecha = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Canal = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Destinatario = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    NombreDestinatario = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Asunto = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Cuerpo = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    Estatus = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Error = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    Origen = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    CitaId = table.Column<int>(type: "INTEGER", nullable: true),
                    PromocionId = table.Column<int>(type: "INTEGER", nullable: true),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensajesEnviados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MensajesEnviados_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlantillasMensaje",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    Canal = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Asunto = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Cuerpo = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlantillasMensaje", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlantillasMensaje_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Promociones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Canal = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    Asunto = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Mensaje = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    FechaEnvio = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Destinatarios = table.Column<int>(type: "INTEGER", nullable: false),
                    Enviados = table.Column<int>(type: "INTEGER", nullable: false),
                    Fallidos = table.Column<int>(type: "INTEGER", nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Promociones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Promociones_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketsSoporte",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Asunto = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Mensaje = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    NombreContacto = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    CorreoContacto = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    EstatusEnvio = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    CuentaId = table.Column<int>(type: "INTEGER", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreadoPorId = table.Column<int>(type: "INTEGER", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketsSoporte", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketsSoporte_Cuentas_CuentaId",
                        column: x => x.CuentaId,
                        principalTable: "Cuentas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Formatos_CuentaId",
                table: "Formatos",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_MensajesEnviados_CitaId",
                table: "MensajesEnviados",
                column: "CitaId");

            migrationBuilder.CreateIndex(
                name: "IX_MensajesEnviados_CuentaId",
                table: "MensajesEnviados",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_MensajesEnviados_Fecha",
                table: "MensajesEnviados",
                column: "Fecha");

            migrationBuilder.CreateIndex(
                name: "IX_MensajesEnviados_PromocionId",
                table: "MensajesEnviados",
                column: "PromocionId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasMensaje_CuentaId",
                table: "PlantillasMensaje",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_PlantillasMensaje_CuentaId_Tipo_Canal",
                table: "PlantillasMensaje",
                columns: new[] { "CuentaId", "Tipo", "Canal" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Promociones_CuentaId",
                table: "Promociones",
                column: "CuentaId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketsSoporte_CuentaId",
                table: "TicketsSoporte",
                column: "CuentaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Formatos");

            migrationBuilder.DropTable(
                name: "MensajesEnviados");

            migrationBuilder.DropTable(
                name: "PlantillasMensaje");

            migrationBuilder.DropTable(
                name: "Promociones");

            migrationBuilder.DropTable(
                name: "TicketsSoporte");
        }
    }
}
