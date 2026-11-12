using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shared.Entities.Migrations
{
    /// <inheritdoc />
    public partial class PinAnalysisJobModelAndUpdateClaudeDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Model",
                table: "AnalysisJobs",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PromptVersion",
                table: "AnalysisJobs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "AnalysisJobs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            // claude-sonnet-4-5 ngừng hoạt động 30/11/2026 và không hỗ trợ structured output.
            // Chỉ đổi khi còn giữ giá trị mặc định cũ, không ghi đè model quản trị viên đã tự chọn.
            migrationBuilder.Sql("""
                UPDATE "SystemConfigs" SET "Value" = 'claude-opus-5-5'
                WHERE "Id" = 'cfg-015' AND "Value" = 'claude-sonnet-4-5-20250929';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Model",
                table: "AnalysisJobs");

            migrationBuilder.DropColumn(
                name: "PromptVersion",
                table: "AnalysisJobs");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "AnalysisJobs");

            migrationBuilder.Sql("""
                UPDATE "SystemConfigs" SET "Value" = 'claude-sonnet-4-5-20250929'
                WHERE "Id" = 'cfg-015' AND "Value" = 'claude-opus-5-5';
                """);
        }
    }
}
