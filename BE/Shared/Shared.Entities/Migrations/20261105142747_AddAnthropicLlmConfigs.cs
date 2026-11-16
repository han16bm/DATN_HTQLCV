using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Shared.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AddAnthropicLlmConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "SystemConfigs",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DataType", "Description", "Group", "IsActive", "Key", "Name", "ServiceType", "UpdatedAt", "UpdatedBy", "Value", "Version" },
                values: new object[,]
                {
                    { "cfg-014", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "Khóa API Claude. Lưu mã hóa trong SystemConfigs và không bao giờ trả giá trị thật về giao diện.", "AI", true, "Analytics:Anthropic:ApiKey", "Anthropic - API key", "Analytics.Api", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "", 1 },
                    { "cfg-015", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "Model ID được gọi bởi Analytics.Api. Chỉ thay đổi nếu model có quyền truy cập trên tài khoản Anthropic.", "AI", true, "Analytics:Anthropic:Model", "Anthropic - mô hình Claude", "Analytics.Api", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "claude-sonnet-4-5-20250929", 1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-014");

            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-015");
        }
    }
}
