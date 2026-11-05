using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Shared.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AdminModulesAndDynamicRbac : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "GrantedFeatures",
                table: "Users",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddColumn<bool>(
                name: "IsSysAdmin",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<List<string>>(
                name: "RevokedFeatures",
                table: "Users",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "PermissionGroups",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                table: "PermissionGroups",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // §1.4 bước 2: nhóm cũ chưa có mã — sinh mã từ Id trước khi tạo unique index
            migrationBuilder.Sql("UPDATE \"PermissionGroups\" SET \"Code\" = 'GROUP_' || left(\"Id\", 8) WHERE \"Code\" = '';");

            migrationBuilder.CreateTable(
                name: "BackgroundJobs",
                columns: table => new
                {
                    Code = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    IntervalMinutes = table.Column<int>(type: "integer", nullable: false),
                    LastRunAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextRunAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastStatus = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BackgroundJobs", x => x.Code);
                    table.CheckConstraint("CK_BackgroundJobs_IntervalMinutes", "\"IntervalMinutes\" BETWEEN 1 AND 1440");
                });

            migrationBuilder.CreateTable(
                name: "Features",
                columns: table => new
                {
                    Code = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ParentCode = table.Column<string>(type: "text", nullable: true),
                    IsGroup = table.Column<bool>(type: "boolean", nullable: false),
                    Scope = table.Column<string>(type: "text", nullable: true),
                    Path = table.Column<string>(type: "text", nullable: true),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Features", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "IpWhitelistEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Cidr = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IpWhitelistEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    Group = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    DataType = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                    DefaultValue = table.Column<string>(type: "text", nullable: false),
                    MinValue = table.Column<int>(type: "integer", nullable: true),
                    MaxValue = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "JobRuns",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    JobCode = table.Column<string>(type: "text", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Trigger = table.Column<string>(type: "text", nullable: false),
                    TriggeredBy = table.Column<string>(type: "text", nullable: true),
                    SummaryJson = table.Column<string>(type: "text", nullable: true),
                    Error = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobRuns_BackgroundJobs_JobCode",
                        column: x => x.JobCode,
                        principalTable: "BackgroundJobs",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Features",
                columns: new[] { "Code", "Description", "Icon", "IsActive", "IsGroup", "Name", "ParentCode", "Path", "Scope", "SortOrder", "UpdatedAt", "Version" },
                values: new object[,]
                {
                    { "ADMIN", null, null, true, true, "Quản trị hệ thống", null, null, null, 10, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "ANALYTICS", null, null, true, true, "Phân tích", null, null, null, 30, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "ANALYTICS_VIEW", null, null, true, false, "Xem phân tích mọi dự án", "ANALYTICS", "/analytics", "SYSTEM", 31, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "AUDIT_VIEW", null, null, true, false, "Xem nhật ký hệ thống", "ADMIN", "/admin/audit-logs", "SYSTEM", 14, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "JOBS_MANAGE", null, null, true, false, "Giám sát và điều khiển job nền", "ADMIN", "/admin/jobs", "SYSTEM", 16, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "ORGANIZATION_MANAGE", null, null, true, false, "Quản lý đơn vị và team", "ADMIN", "/admin/organization", "SYSTEM", 12, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "PERMISSIONS_MANAGE", null, null, true, false, "Quản lý nhóm quyền và phân quyền", "ADMIN", "/admin/permission-groups", "SYSTEM", 13, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "PROJECT_CREATE", null, null, true, false, "Tạo dự án và giữ vai trò quản lý dự án", "WORK", "/projects/new", "SYSTEM", 21, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "SETTINGS_MANAGE", null, null, true, false, "Cấu hình hệ thống và IP whitelist", "ADMIN", "/admin/settings", "SYSTEM", 15, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "USERS_MANAGE", null, null, true, false, "Quản lý người dùng", "ADMIN", "/admin/users", "SYSTEM", 11, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "WORK", null, null, true, true, "Dự án và công việc", null, null, null, 20, new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 }
                });

            migrationBuilder.InsertData(
                table: "PermissionGroups",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Features", "IsSystem", "Name", "Status", "UpdatedAt", "Version" },
                values: new object[,]
                {
                    { "pg-admin", "ADMINISTRATORS", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"USERS_MANAGE\",\"ORGANIZATION_MANAGE\",\"PERMISSIONS_MANAGE\",\"AUDIT_VIEW\",\"SETTINGS_MANAGE\",\"JOBS_MANAGE\",\"ANALYTICS_VIEW\"]", true, "Quản trị viên", "Active", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 },
                    { "pg-pm", "PROJECT_MANAGERS", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), null, "[\"PROJECT_CREATE\"]", true, "Quản lý dự án (Leader/PM)", "Active", new DateTime(2026, 11, 3, 0, 0, 0, 0, DateTimeKind.Utc), 1 }
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

            migrationBuilder.CreateIndex(
                name: "IX_PermissionGroups_Code",
                table: "PermissionGroups",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_ActorId_At",
                table: "AuditLogs",
                columns: new[] { "ActorId", "At" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_At",
                table: "AuditLogs",
                column: "At",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_JobRuns_JobCode_StartedAt",
                table: "JobRuns",
                columns: new[] { "JobCode", "StartedAt" });

            // §1.4 bước 5: chuyển dữ liệu SystemRole sang sysadmin/nhóm hệ thống TRƯỚC khi xoá cột
            migrationBuilder.Sql("UPDATE \"Users\" SET \"IsSysAdmin\" = TRUE WHERE \"SystemRole\" = 'Admin';");
            migrationBuilder.Sql(@"INSERT INTO ""PermissionGroupMembers"" (""PermissionGroupId"", ""UserId"")
SELECT 'pg-admin', ""Id"" FROM ""Users"" WHERE ""SystemRole"" = 'Admin'
ON CONFLICT DO NOTHING;");
            migrationBuilder.Sql(@"INSERT INTO ""PermissionGroupMembers"" (""PermissionGroupId"", ""UserId"")
SELECT 'pg-pm', ""Id"" FROM ""Users"" WHERE ""SystemRole"" = 'Manager'
ON CONFLICT DO NOTHING;");

            // §1.4 bước 6
            migrationBuilder.DropColumn(
                name: "SystemRole",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SystemRole",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "Employee");

            migrationBuilder.Sql(@"UPDATE ""Users"" SET ""SystemRole"" = 'Manager'
WHERE ""Id"" IN (SELECT ""UserId"" FROM ""PermissionGroupMembers"" WHERE ""PermissionGroupId"" = 'pg-pm');");
            migrationBuilder.Sql("UPDATE \"Users\" SET \"SystemRole\" = 'Admin' WHERE \"IsSysAdmin\";");

            migrationBuilder.DropTable(
                name: "Features");

            migrationBuilder.DropTable(
                name: "IpWhitelistEntries");

            migrationBuilder.DropTable(
                name: "JobRuns");

            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.DropTable(
                name: "BackgroundJobs");

            migrationBuilder.DropIndex(
                name: "IX_PermissionGroups_Code",
                table: "PermissionGroups");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_ActorId_At",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_At",
                table: "AuditLogs");

            migrationBuilder.DeleteData(
                table: "PermissionGroups",
                keyColumn: "Id",
                keyValue: "pg-admin");

            migrationBuilder.DeleteData(
                table: "PermissionGroups",
                keyColumn: "Id",
                keyValue: "pg-pm");

            migrationBuilder.DropColumn(
                name: "GrantedFeatures",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsSysAdmin",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RevokedFeatures",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "PermissionGroups");

            migrationBuilder.DropColumn(
                name: "IsSystem",
                table: "PermissionGroups");
        }
    }
}
