using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HybridLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBodyWeightProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Índice temporário para manter a foreign key de StudentId válida
            migrationBuilder.CreateIndex(
                name: "IX_BodyWeightEntries_StudentId_Temp",
                table: "BodyWeightEntries",
                column: "StudentId");

            migrationBuilder.DropIndex(
                name: "IX_BodyWeightEntries_StudentId_RecordedAt",
                table: "BodyWeightEntries");

            migrationBuilder.AddColumn<decimal>(
                name: "GoalWeightKg",
                table: "Students",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "RecordedAt",
                table: "BodyWeightEntries",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)");

            migrationBuilder.Sql(
                """
        DELETE olderEntry
        FROM BodyWeightEntries AS olderEntry
        INNER JOIN BodyWeightEntries AS newerEntry
            ON olderEntry.StudentId = newerEntry.StudentId
            AND olderEntry.RecordedAt = newerEntry.RecordedAt
            AND olderEntry.Id < newerEntry.Id;
        """
            );

            migrationBuilder.CreateIndex(
                name: "IX_BodyWeightEntries_StudentId_RecordedAt",
                table: "BodyWeightEntries",
                columns: new[] { "StudentId", "RecordedAt" },
                unique: true);

            // O novo índice composto já começa por StudentId,
            // então volta a servir para a foreign key
            migrationBuilder.DropIndex(
                name: "IX_BodyWeightEntries_StudentId_Temp",
                table: "BodyWeightEntries");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_BodyWeightEntries_StudentId_Temp",
                table: "BodyWeightEntries",
                column: "StudentId");

            migrationBuilder.DropIndex(
                name: "IX_BodyWeightEntries_StudentId_RecordedAt",
                table: "BodyWeightEntries");

            migrationBuilder.DropColumn(
                name: "GoalWeightKg",
                table: "Students");

            migrationBuilder.AlterColumn<DateTime>(
                name: "RecordedAt",
                table: "BodyWeightEntries",
                type: "datetime(6)",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "date");

            migrationBuilder.CreateIndex(
                name: "IX_BodyWeightEntries_StudentId_RecordedAt",
                table: "BodyWeightEntries",
                columns: new[] { "StudentId", "RecordedAt" });

            migrationBuilder.DropIndex(
                name: "IX_BodyWeightEntries_StudentId_Temp",
                table: "BodyWeightEntries");
        }
    }
}