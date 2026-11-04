namespace Shared.Entities;

public static class PermissionFeatures
{
    // Quyền hệ thống — có dòng tương ứng trong bảng Features (SeedData.Features)
    public const string UsersManage = "USERS_MANAGE";
    public const string OrganizationManage = "ORGANIZATION_MANAGE";
    public const string PermissionsManage = "PERMISSIONS_MANAGE";
    public const string AuditView = "AUDIT_VIEW";
    public const string SettingsManage = "SETTINGS_MANAGE";
    public const string JobsManage = "JOBS_MANAGE";
    public const string ProjectCreate = "PROJECT_CREATE";
    public const string AnalyticsView = "ANALYTICS_VIEW";

    // Quyền theo dự án — suy ra từ ProjectRole, không nằm trong Features
    public const string ProjectManage = "PROJECT_MANAGE";
    public const string MembersManage = "MEMBERS_MANAGE";
    public const string TasksManage = "TASKS_MANAGE";
    public const string AlertsManage = "ALERTS_MANAGE";
}
