using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HybridLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutExerciseCompletion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "WorkoutExercises",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "WorkoutExercises",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "WorkoutExercises");

            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "WorkoutExercises");
        }
    }
}
