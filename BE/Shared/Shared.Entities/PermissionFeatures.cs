namespace Shared.Entities;

public static class PermissionFeatures
{
    public const string UsersManage = "USERS_MANAGE";
    public const string OrganizationManage = "ORGANIZATION_MANAGE";
    public const string ProjectCreate = "PROJECT_CREATE";
    public const string ProjectManage = "PROJECT_MANAGE";
    public const string MembersManage = "MEMBERS_MANAGE";
    public const string TasksManage = "TASKS_MANAGE";
    public const string AnalyticsView = "ANALYTICS_VIEW";
    public const string AlertsManage = "ALERTS_MANAGE";

    public static readonly string[] All =
    [
        UsersManage, OrganizationManage, ProjectCreate, ProjectManage,
        MembersManage, TasksManage, AnalyticsView, AlertsManage
    ];
}
