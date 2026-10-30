using Microsoft.EntityFrameworkCore;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Shared.Entities;

public static class PermissionEvaluator
{
    public static async Task<List<string>> GetEffectivePermissionsAsync(ApplicationDbContext context, User user)
    {
        var implicitPermissions = new List<string>();
        if (user.SystemRole == SystemRole.Admin)
            implicitPermissions.AddRange([PermissionFeatures.UsersManage, PermissionFeatures.OrganizationManage, PermissionFeatures.AnalyticsView]);
        if (user.SystemRole == SystemRole.Manager)
            implicitPermissions.Add(PermissionFeatures.ProjectCreate);

        var groupFeatureLists = await context.PermissionGroupMembers
            .Where(m => m.UserId == user.Id && m.PermissionGroup!.Status == OrgStatus.Active)
            .Select(m => m.PermissionGroup!.Features)
            .ToListAsync();

        return implicitPermissions.Concat(groupFeatureLists.SelectMany(f => f)).Distinct().ToList();
    }
}
