using Microsoft.EntityFrameworkCore;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Shared.Entities;

public static class PermissionEvaluator
{
    /// <summary>
    /// Quyền hiệu lực (ADMIN_MODULES.md §1.2): sysadmin = mọi Feature đang bật;
    /// còn lại = (quyền nhóm Active ∪ Granted) − Revoked ∩ Feature đang bật. Tính theo DB mỗi lần gọi.
    /// </summary>
    public static async Task<List<string>> GetEffectivePermissionsAsync(ApplicationDbContext context, User user)
    {
        var activeFeatures = await context.Features.AsNoTracking()
            .Where(f => f.IsActive && !f.IsGroup)
            .OrderBy(f => f.SortOrder)
            .Select(f => f.Code)
            .ToListAsync();
        if (user.IsSysAdmin)
            return activeFeatures;

        var groupFeatureLists = await context.PermissionGroupMembers.AsNoTracking()
            .Where(m => m.UserId == user.Id && m.PermissionGroup!.Status == OrgStatus.Active)
            .Select(m => m.PermissionGroup!.Features)
            .ToListAsync();

        var granted = groupFeatureLists.SelectMany(f => f).Concat(user.GrantedFeatures).Except(user.RevokedFeatures).ToHashSet();
        return activeFeatures.Where(granted.Contains).ToList();
    }

    public static async Task<bool> HasPermissionAsync(ApplicationDbContext context, User user, string feature)
    {
        return (await GetEffectivePermissionsAsync(context, user)).Contains(feature);
    }
}
