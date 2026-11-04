using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shared.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AddIpAccessLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IpAccessLogs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Ip = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Scope = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    FirstSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HitCount = table.Column<int>(type: "integer", nullable: false),
                    BlockedCount = table.Column<int>(type: "integer", nullable: false),
                    LastUserId = table.Column<string>(type: "text", nullable: true),
                    LastUsername = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ResolvedBy = table.Column<string>(type: "text", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolveNote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IpAccessLogs", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "SystemConfigs",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DataType", "Description", "Group", "IsActive", "Key", "Name", "ServiceType", "UpdatedAt", "UpdatedBy", "Value", "Version" },
                values: new object[] { "cfg-007", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "STRING", "ADMIN: chỉ chặn API khu quản trị. SYSTEM: chặn mọi API của 4 service, kể cả đăng nhập.", "SECURITY", true, "Security:IpWhitelistScope", "Phạm vi IP whitelist", "Global", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "ADMIN", 1 });

            migrationBuilder.CreateIndex(
                name: "IX_IpAccessLogs_Ip_Scope",
                table: "IpAccessLogs",
                columns: new[] { "Ip", "Scope" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IpAccessLogs");

            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-007");
        }
    }
}
