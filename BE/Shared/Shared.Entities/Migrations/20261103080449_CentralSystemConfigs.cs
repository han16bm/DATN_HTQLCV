using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Shared.Entities.Migrations
{
    /// <inheritdoc />
    public partial class CentralSystemConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.CreateTable(
                name: "SystemConfigs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    Key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ServiceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Group = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    DataType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemConfigs", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "SystemConfigs",
                columns: new[] { "Id", "CreatedAt", "DataType", "Description", "Group", "IsActive", "Key", "Name", "ServiceType", "UpdatedAt", "UpdatedBy", "Value", "Version" },
                values: new object[,]
                {
                    { "cfg-001", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), "STRING", "Định danh bên phát token. Mọi service và Gateway phải dùng cùng giá trị.", "JWT", true, "Jwt:Issuer", "JWT issuer", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "datn-identity", 1 },
                    { "cfg-002", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), "STRING", "Đối tượng nhận token. Mọi service và Gateway phải dùng cùng giá trị.", "JWT", true, "Jwt:Audience", "JWT audience", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "datn-clients", 1 },
                    { "cfg-003", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), "INT", "Thời hạn access token cấp khi đăng nhập hoặc làm mới phiên.", "JWT", true, "Jwt:AccessTokenHours", "Thời hạn phiên đăng nhập (giờ)", "Identity.Api", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "8", 1 },
                    { "cfg-004", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), "INT", "Vượt quá số lần này tài khoản bị khoá tự động.", "AUTH", true, "Auth:MaxFailedAttempts", "Số lần đăng nhập sai tối đa", "Identity.Api", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "5", 1 },
                    { "cfg-005", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), "BOOL", "Khi bật, chỉ IP khớp danh sách whitelist mới gọi được API quản trị.", "SECURITY", true, "Security:AdminIpWhitelistEnabled", "Bật IP whitelist khu quản trị", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "false", 1 },
                    { "cfg-006", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), "STRING", "Mức log Serilog áp dụng cho mọi service khi khởi động.", "LOGGING", true, "Serilog:MinimumLevel", "Mức log tối thiểu", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "Information", 1 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigs_Key_ServiceType",
                table: "SystemConfigs",
                columns: new[] { "Key", "ServiceType" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemConfigs");

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DataType = table.Column<string>(type: "text", nullable: false),
                    DefaultValue = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Group = table.Column<string>(type: "text", nullable: false),
                    MaxValue = table.Column<int>(type: "integer", nullable: true),
                    MinValue = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    Value = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Key);
                });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Key", "DataType", "DefaultValue", "Description", "Group", "MaxValue", "MinValue", "Name", "UpdatedAt", "UpdatedBy", "Value", "Version" },
                values: new object[,]
                {
                    { "auth.accessTokenHours", "INT", "8", "Thời hạn access token cấp khi đăng nhập hoặc làm mới phiên.", "AUTH", 24, 1, "Thời hạn phiên đăng nhập (giờ)", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "8", 1 },
                    { "auth.maxFailedAttempts", "INT", "5", "Vượt quá số lần này tài khoản bị khoá tự động.", "AUTH", 20, 3, "Số lần đăng nhập sai tối đa", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "5", 1 },
                    { "security.adminIpWhitelistEnabled", "BOOL", "false", "Khi bật, chỉ IP khớp danh sách whitelist mới truy cập được API quản trị.", "SECURITY", null, null, "Bật IP whitelist khu quản trị", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "false", 1 }
                });
        }
    }
}
