using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shared.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalysisExplanationRatings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnalysisExplanationRatings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AnalysisId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AnalysisType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ExplanationGeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModelDisplayName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PromptVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ActorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Helpful = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalysisExplanationRatings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisExplanationRatings_AnalysisId_ActorId_ExplanationGe~",
                table: "AnalysisExplanationRatings",
                columns: new[] { "AnalysisId", "ActorId", "ExplanationGeneratedAt" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnalysisExplanationRatings_ModelDisplayName_PromptVersion",
                table: "AnalysisExplanationRatings",
                columns: new[] { "ModelDisplayName", "PromptVersion" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnalysisExplanationRatings");
        }
    }
}
