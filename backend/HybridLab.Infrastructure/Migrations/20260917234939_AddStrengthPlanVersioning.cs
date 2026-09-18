using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HybridLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStrengthPlanVersioning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "StrengthPlans",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PreviousVersionId",
                table: "StrengthPlans",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "StrengthPlans",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VersionNumber",
                table: "StrengthPlans",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "StrengthPlans");

            migrationBuilder.DropColumn(
                name: "PreviousVersionId",
                table: "StrengthPlans");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "StrengthPlans");

            migrationBuilder.DropColumn(
                name: "VersionNumber",
                table: "StrengthPlans");
        }
    }
}
