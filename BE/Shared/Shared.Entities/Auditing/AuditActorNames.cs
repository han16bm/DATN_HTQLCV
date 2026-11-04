using Microsoft.EntityFrameworkCore;

namespace Shared.Entities.Auditing;

/// <summary>Tra tên hiển thị cho CreatedBy/UpdatedBy — dùng chung cho mọi service để mọi DTO trả cùng nhãn.</summary>
public static class AuditActorNames
{
    /// <summary>Id → nhãn; "SYSTEM" → "Hệ thống"; Id không còn trong Users → chính Id.</summary>
    public static async Task<Dictionary<string, string>> LoadAsync(ApplicationDbContext context, IEnumerable<string?> actorIds)
    {
        var ids = actorIds.Where(id => !string.IsNullOrEmpty(id) && id != AuditActors.System).Select(id => id!).Distinct().ToList();
        var names = ids.Count == 0
            ? new Dictionary<string, string>()
            : await context.Users.AsNoTracking()
                .Where(u => ids.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.DisplayName);
        names[AuditActors.System] = AuditActors.SystemLabel;
        return names;
    }

    /// <summary>Nhãn cho một actor; null khi không có dữ liệu (dòng cũ chưa có lịch sử).</summary>
    public static string? Label(string? actorId, IReadOnlyDictionary<string, string> names)
    {
        if (string.IsNullOrEmpty(actorId)) return null;
        return names.TryGetValue(actorId, out var name) ? name : actorId;
    }
}
