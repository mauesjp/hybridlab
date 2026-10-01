using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HybridLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHybridTrainingPlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HybridTrainingPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HybridTrainingPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HybridTrainingPlans_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "HybridTrainingWeeks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HybridTrainingPlanId = table.Column<int>(type: "int", nullable: false),
                    WeekNumber = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HybridTrainingWeeks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HybridTrainingWeeks_HybridTrainingPlans_HybridTrainingPlanId",
                        column: x => x.HybridTrainingPlanId,
                        principalTable: "HybridTrainingPlans",
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
                    HybridTrainingWeekId = table.Column<int>(type: "int", nullable: false),
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
                        name: "FK_HybridWeekSessions_HybridTrainingWeeks_HybridTrainingWeekId",
                        column: x => x.HybridTrainingWeekId,
                        principalTable: "HybridTrainingWeeks",
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
                name: "IX_HybridTrainingPlans_StudentId",
                table: "HybridTrainingPlans",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_HybridTrainingPlans_StudentId_IsActive",
                table: "HybridTrainingPlans",
                columns: new[] { "StudentId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_HybridTrainingWeeks_HybridTrainingPlanId_WeekNumber",
                table: "HybridTrainingWeeks",
                columns: new[] { "HybridTrainingPlanId", "WeekNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HybridWeekSessions_HybridTrainingWeekId_DayOfWeek_Sequence",
                table: "HybridWeekSessions",
                columns: new[] { "HybridTrainingWeekId", "DayOfWeek", "Sequence" });

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
                name: "HybridTrainingWeeks");

            migrationBuilder.DropTable(
                name: "HybridTrainingPlans");
        }
    }
}
