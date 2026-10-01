using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HybridLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHybridWeekPlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HybridWeekPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HybridWeekPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HybridWeekPlans_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "HybridWeekSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HybridWeekPlanId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    SessionType = table.Column<int>(type: "int", nullable: false),
                    Period = table.Column<int>(type: "int", nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    StrengthWorkoutDayId = table.Column<int>(type: "int", nullable: true),
                    RunningWorkoutId = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HybridWeekSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HybridWeekSessions_HybridWeekPlans_HybridWeekPlanId",
                        column: x => x.HybridWeekPlanId,
                        principalTable: "HybridWeekPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HybridWeekSessions_RunningWorkouts_RunningWorkoutId",
                        column: x => x.RunningWorkoutId,
                        principalTable: "RunningWorkouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_HybridWeekSessions_StrengthWorkoutDays_StrengthWorkoutDayId",
                        column: x => x.StrengthWorkoutDayId,
                        principalTable: "StrengthWorkoutDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_HybridWeekPlans_StudentId",
                table: "HybridWeekPlans",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_HybridWeekPlans_StudentId_IsActive",
                table: "HybridWeekPlans",
                columns: new[] { "StudentId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_HybridWeekSessions_HybridWeekPlanId_DayOfWeek_Sequence",
                table: "HybridWeekSessions",
                columns: new[] { "HybridWeekPlanId", "DayOfWeek", "Sequence" });

            migrationBuilder.CreateIndex(
                name: "IX_HybridWeekSessions_RunningWorkoutId",
                table: "HybridWeekSessions",
                column: "RunningWorkoutId");

            migrationBuilder.CreateIndex(
                name: "IX_HybridWeekSessions_StrengthWorkoutDayId",
                table: "HybridWeekSessions",
                column: "StrengthWorkoutDayId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HybridWeekSessions");

            migrationBuilder.DropTable(
                name: "HybridWeekPlans");
        }
    }
}
