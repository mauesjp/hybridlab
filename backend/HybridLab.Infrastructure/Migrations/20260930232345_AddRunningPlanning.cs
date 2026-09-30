using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HybridLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRunningPlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RunningWorkouts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ScheduledDate = table.Column<DateTime>(type: "date", nullable: false),
                    Notes = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RunningWorkouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RunningWorkouts_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RunningWorkoutBlocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RunningWorkoutId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    DistanceKm = table.Column<decimal>(type: "decimal(7,2)", precision: 7, scale: 2, nullable: true),
                    DurationSeconds = table.Column<int>(type: "int", nullable: true),
                    TargetPaceSecondsPerKm = table.Column<int>(type: "int", nullable: true),
                    Repetitions = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RunningWorkoutBlocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RunningWorkoutBlocks_RunningWorkouts_RunningWorkoutId",
                        column: x => x.RunningWorkoutId,
                        principalTable: "RunningWorkouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_RunningWorkoutBlocks_RunningWorkoutId_Sequence",
                table: "RunningWorkoutBlocks",
                columns: new[] { "RunningWorkoutId", "Sequence" });

            migrationBuilder.CreateIndex(
                name: "IX_RunningWorkouts_StudentId_ScheduledDate",
                table: "RunningWorkouts",
                columns: new[] { "StudentId", "ScheduledDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RunningWorkoutBlocks");

            migrationBuilder.DropTable(
                name: "RunningWorkouts");
        }
    }
}
