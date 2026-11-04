using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Shared.Entities.Authorization;

/// <summary>
/// Quyền của một người trong từng dự án (ADMIN_MODULES §11), tính từ DB mỗi request:
/// vai trò đang hoạt động trong ProjectMemberships × ma trận ByRole. OWNER/MANAGER chỉ có
/// hiệu lực khi người đó đang có PROJECT_CREATE; ANALYTICS_VIEW hệ thống cho xem mọi dự án.
/// Bản tham chiếu: projectPermissions/requireProject/visibleTask trong FE/src/mocks/db.ts.
/// </summary>
public sealed class ProjectAccess
{
    // Khớp permissionPolicy.project của FE mock.
    public static readonly IReadOnlyDictionary<ProjectRole, string[]> ByRole = new Dictionary<ProjectRole, string[]>
    {
        [ProjectRole.Owner] = Managing,
        [ProjectRole.Manager] = Managing,
        [ProjectRole.Member] = [],
    };

    private static string[] Managing =>
    [
        PermissionFeatures.ProjectManage, PermissionFeatures.MembersManage, PermissionFeatures.TasksManage,
        PermissionFeatures.TasksReview, PermissionFeatures.AnalyticsView, PermissionFeatures.AlertsManage,
    ];

    private readonly Dictionary<string, (ProjectRole Role, string[] Permissions)> _projects;

    private ProjectAccess(string userId, List<string> systemPermissions,
        Dictionary<string, (ProjectRole, string[])> projects)
    {
        UserId = userId;
        SystemPermissions = systemPermissions;
        _projects = projects;
    }

    public string UserId { get; }
    public IReadOnlyList<string> SystemPermissions { get; }
    public bool ReadsEveryProject => SystemPermissions.Contains(PermissionFeatures.AnalyticsView);
    /// <summary>Các dự án người này đang là thành viên.</summary>
    public IEnumerable<string> ProjectIds => _projects.Keys;

    public static async Task<ProjectAccess> LoadAsync(ApplicationDbContext context, string userId)
    {
        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        var system = user is null ? [] : await PermissionEvaluator.GetEffectivePermissionsAsync(context, user);
        var manages = system.Contains(PermissionFeatures.ProjectCreate);
        var memberships = await context.ProjectMemberships.AsNoTracking()
            .Where(m => m.UserId == userId && m.EndedAt == null)
            .Select(m => new { m.ProjectId, m.ProjectRole })
            .ToListAsync();
        var projects = memberships
            .GroupBy(m => m.ProjectId)
            .ToDictionary(g => g.Key, g =>
            {
                var role = g.Min(m => m.ProjectRole); // Owner < Manager < Member
                return (role, role == ProjectRole.Member || manages ? ByRole[role] : []);
            });
        return new ProjectAccess(userId, system, projects);
    }

    public bool IsMember(string projectId) => _projects.ContainsKey(projectId);
    public ProjectRole? RoleIn(string projectId) => _projects.TryGetValue(projectId, out var p) ? p.Role : null;
    public string[] PermissionsIn(string projectId) => _projects.TryGetValue(projectId, out var p) ? p.Permissions : [];
    public bool CanRead(string projectId) => ReadsEveryProject || IsMember(projectId);

    public bool Has(string projectId, string permission) =>
        (permission == PermissionFeatures.AnalyticsView && ReadsEveryProject) ||
        PermissionsIn(projectId).Contains(permission);

    public IEnumerable<string> ProjectIdsWith(string permission) =>
        _projects.Where(p => p.Value.Permissions.Contains(permission)).Select(p => p.Key);

    /// <summary>Như requireProject của mock: dự án không có → 404; không đọc được hoặc thiếu mã → 403.</summary>
    public async Task<Project> EnsureAsync(ApplicationDbContext context, string projectId, string? permission = null)
    {
        var project = await context.Projects.FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new NotFoundException("Không tìm thấy dự án.");
        if (!CanRead(projectId) || (permission is not null && !Has(projectId, permission)))
            throw new ForbiddenException("Bạn không có quyền thực hiện trong dự án.");
        return project;
    }
}
