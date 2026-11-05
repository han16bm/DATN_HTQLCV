using Identity.Api.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Auditing;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

/// <summary>Ghi audit log trong cùng transaction với thay đổi dữ liệu — gọi trước SaveChanges, không sau.</summary>
public class BaseService<T>(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
{
    protected async Task WriteAuditLog(string entityId, string action, object? before, object? after, string? reason = null)
    {
        var actorId = httpContextAccessor.HttpContext?.GetUserId() ?? "SYSTEM";
        await context.AuditLogs.AddAsync(new AuditLog
        {
            Id = GuidGenerator.NewId(),
            EntityType = typeof(T).Name,
            EntityId = entityId,
            ActorId = actorId,
            Action = action,
            At = DateTime.UtcNow,
            BeforeJson = before is null ? null : System.Text.Json.JsonSerializer.Serialize(before),
            AfterJson = after is null ? null : System.Text.Json.JsonSerializer.Serialize(after),
            Reason = reason
        });
    }

    protected string? CurrentUserId()
    {
        return httpContextAccessor.HttpContext?.GetUserId();
    }

    protected async Task<User> GetActorAsync()
    {
        var actorId = CurrentUserId() ?? throw new UnauthorizedException("Thiếu định danh người thao tác.");
        return await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actorId)
            ?? throw new UnauthorizedException("Không tìm thấy tài khoản người thao tác.");
    }

    /// <summary>Chống leo thang quyền (§1.3): người không phải sysadmin chỉ trao được mã mà chính họ đang có hiệu lực.</summary>
    protected async Task EnsureCanGrantAsync(IEnumerable<string> features)
    {
        var requested = features.Distinct().ToList();
        if (requested.Count == 0)
            return;

        var actor = await GetActorAsync();
        if (actor.IsSysAdmin)
            return;

        var effective = await PermissionEvaluator.GetEffectivePermissionsAsync(context, actor);
        var missing = requested.Except(effective).ToList();
        if (missing.Count > 0)
            throw new ForbiddenException($"Không thể trao quyền mà bạn không có: {string.Join(", ", missing)}.");
    }

    /// <summary>
    /// Không thao tác (sửa, khóa, mở khóa, cấp lại mật khẩu) lên tài khoản có quyền cao hơn mình:
    /// sysadmin chỉ do sysadmin quản lý; quyền hiệu lực của người bị tác động phải nằm trong quyền của người làm.
    /// </summary>
    protected async Task EnsureCanManageAsync(User target)
    {
        var actor = await GetActorAsync();
        if (actor.IsSysAdmin) return;
        if (target.IsSysAdmin)
            throw new ForbiddenException("Chỉ sysadmin được thao tác trên tài khoản sysadmin.");
        await EnsureCanGrantAsync(await PermissionEvaluator.GetEffectivePermissionsAsync(context, target));
    }

    /// <summary>Mã quyền phải là node quyền (không phải node nhóm) có trong danh mục Features.</summary>
    protected async Task ValidateFeatureCodesAsync(IEnumerable<string> features, string field)
    {
        var requested = features.Distinct().ToList();
        var known = await context.Features.AsNoTracking().Where(f => !f.IsGroup).Select(f => f.Code).ToListAsync();
        var invalid = requested.Except(known).ToList();
        if (invalid.Count > 0)
            throw new ValidationException($"Mã quyền không hợp lệ: {string.Join(", ", invalid)}.", [field]);
    }

    /// <summary>Quyền gộp của các nhóm — dùng để kiểm tra chống leo thang khi thêm người vào nhóm.</summary>
    protected async Task<List<string>> GroupFeaturesAsync(IEnumerable<string> groupIds)
    {
        var ids = groupIds.Distinct().ToList();
        var lists = await context.PermissionGroups.AsNoTracking().Where(g => ids.Contains(g.Id)).Select(g => g.Features).ToListAsync();
        return lists.SelectMany(f => f).Distinct().ToList();
    }

    protected static void CheckVersion(int current, int ifMatch)
    {
        if (ifMatch <= 0) throw new PreconditionRequiredException("Thiếu If-Match.");
        if (current != ifMatch) throw new PreconditionFailedException("Dữ liệu đã bị thay đổi bởi người khác.");
    }

    protected static RefDto? PersonRef(string? userId, Dictionary<string, string> names)
    {
        var label = AuditActorNames.Label(userId, names);
        return label is null ? null : new RefDto(userId!, label);
    }

    /// <summary>Id → tên hiển thị (gồm "SYSTEM" → "Hệ thống"); gọi một lần cho cả lô để tránh N+1.</summary>
    protected async Task<Dictionary<string, string>> LoadDisplayNamesAsync(IEnumerable<string?> userIds)
    {
        return await AuditActorNames.LoadAsync(context, userIds);
    }
}
