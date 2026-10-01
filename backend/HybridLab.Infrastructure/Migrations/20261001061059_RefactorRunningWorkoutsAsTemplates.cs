using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HybridLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorRunningWorkoutsAsTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Primeiro cria um índice que continue atendendo
            // a FK RunningWorkouts -> Students.
            migrationBuilder.CreateIndex(
                name: "IX_RunningWorkouts_StudentId",
                table: "RunningWorkouts",
                column: "StudentId");

            // Agora o índice composto pode ser removido com segurança.
            migrationBuilder.DropIndex(
                name: "IX_RunningWorkouts_StudentId_ScheduledDate",
                table: "RunningWorkouts");

            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                table: "RunningWorkouts");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledDate",
                table: "RunningWorkouts",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(
                    2000,
                    1,
                    1,
                    0,
                    0,
                    0,
                    DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_RunningWorkouts_StudentId_ScheduledDate",
                table: "RunningWorkouts",
                columns: new[] { "StudentId", "ScheduledDate" });

            migrationBuilder.DropIndex(
                name: "IX_RunningWorkouts_StudentId",
                table: "RunningWorkouts");
        }
    }
}