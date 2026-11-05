using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shared.Entities.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditStamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Units",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Units",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Teams",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "SystemConfigs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "ProjectMemberships",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "ProjectMemberships",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "PermissionGroups",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "PermissionGroups",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "IpWhitelistEntries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Features",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "BackgroundJobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Alerts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Alerts",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "ADMIN",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "ANALYTICS",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "ANALYTICS_VIEW",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "AUDIT_VIEW",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "JOBS_MANAGE",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "ORGANIZATION_MANAGE",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "PERMISSIONS_MANAGE",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "PROJECT_CREATE",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "SETTINGS_MANAGE",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "USERS_MANAGE",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "Code",
                keyValue: "WORK",
                column: "UpdatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "PermissionGroups",
                keyColumn: "Id",
                keyValue: "pg-admin",
                columns: new[] { "CreatedBy", "UpdatedBy" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "PermissionGroups",
                keyColumn: "Id",
                keyValue: "pg-pm",
                columns: new[] { "CreatedBy", "UpdatedBy" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-001",
                column: "CreatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-002",
                column: "CreatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-003",
                column: "CreatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-004",
                column: "CreatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-005",
                column: "CreatedBy",
                value: null);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: "cfg-006",
                column: "CreatedBy",
                value: null);

            // Backfill dấu vết cho dữ liệu đã có từ lịch sử AuditLogs: người ghi sớm nhất = người tạo, mới nhất = người sửa cuối.
            // Dòng không có lịch sử giữ NULL (FE hiển thị "Không rõ"); riêng cảnh báo luôn do job sinh nên người tạo là SYSTEM.
            migrationBuilder.Sql(@"UPDATE ""Users"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'User' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Users"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'User' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Units"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Unit' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Units"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Unit' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Teams"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Team' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Teams"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Team' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""PermissionGroups"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'PermissionGroup' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""PermissionGroups"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'PermissionGroup' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Projects"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Project' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Projects"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Project' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""ProjectMemberships"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'ProjectMembership' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""ProjectMemberships"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'ProjectMembership' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Tasks"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'WorkTask' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Tasks"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'WorkTask' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Alerts"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Alert' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Alerts"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Alert' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""SystemConfigs"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'SystemConfig' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""SystemConfigs"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'SystemConfig' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""IpWhitelistEntries"" t SET ""CreatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'IpWhitelistEntry' ORDER BY ""EntityId"", ""At"" ASC) a WHERE a.""EntityId"" = t.""Id"" AND t.""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""IpWhitelistEntries"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'IpWhitelistEntry' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Id"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Features"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'Feature' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Code"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""BackgroundJobs"" t SET ""UpdatedBy"" = a.""ActorId"" FROM (SELECT DISTINCT ON (""EntityId"") ""EntityId"", ""ActorId"" FROM ""AuditLogs"" WHERE ""EntityType"" = 'BackgroundJob' ORDER BY ""EntityId"", ""At"" DESC) a WHERE a.""EntityId"" = t.""Code"" AND t.""UpdatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Alerts"" SET ""CreatedBy"" = 'SYSTEM' WHERE ""CreatedBy"" IS NULL;");
            migrationBuilder.Sql(@"UPDATE ""Alerts"" SET ""UpdatedBy"" = COALESCE(""HandledBy"", 'SYSTEM') WHERE ""UpdatedBy"" IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "SystemConfigs");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "ProjectMemberships");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "ProjectMemberships");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "PermissionGroups");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "PermissionGroups");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "IpWhitelistEntries");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Features");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "BackgroundJobs");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Alerts");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Alerts");
        }
    }
}
