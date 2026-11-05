using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;

namespace Tasks.Api.Services;

public abstract class BaseService(ApplicationDbContext db, IHttpContextAccessor http)
{
    protected readonly ApplicationDbContext Db = db;

    // Người gọi lấy từ token; dùng cho các API đọc không nhận actorId từ controller.
    protected string ViewerId => http.HttpContext?.GetUserId()
        ?? throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");

    /// <summary>Quyền của người gọi trong từng dự án (ADMIN_MODULES §11).</summary>
    protected Task<ProjectAccess> AccessAsync() => ProjectAccess.LoadAsync(Db, ViewerId);

    /// <summary>
    /// Công việc người gọi được thấy (visibleTask của mock): xem mọi dự án, hoặc là thành viên và
    /// (có quyền quản lý trong dự án hoặc đang/từng được giao việc đó).
    /// </summary>
    protected IQueryable<WorkTask> VisibleTasks(ProjectAccess access)
    {
        if (access.ReadsEveryProject) return Db.Tasks;
        var member = access.ProjectIds.ToList();
        var managed = member.Where(p => access.PermissionsIn(p).Length > 0).ToList();
        var uid = access.UserId;
        return Db.Tasks.Where(t => member.Contains(t.ProjectId) && (managed.Contains(t.ProjectId)
            || t.AssigneeId == uid || Db.TaskAssignments.Any(a => a.TaskId == t.Id && a.AssigneeId == uid)));
    }

    /// <summary>Công việc không có → 404; không thấy được, hoặc thiếu mã quyền của dự án → 403.</summary>
    protected async Task<WorkTask> RequireTaskAsync(string taskId, string? permission = null)
    {
        var task = await Db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId)
            ?? throw new NotFoundException("Không tìm thấy công việc.");
        var access = await AccessAsync();
        if (!await VisibleTasks(access).AnyAsync(t => t.Id == taskId))
            throw new ForbiddenException("Bạn không có quyền xem công việc này.");
        if (permission is not null && !access.Has(task.ProjectId, permission))
            throw new ForbiddenException("Bạn không có quyền thực hiện trong dự án.");
        return task;
    }

    protected void WriteAuditLog(string entityType, string entityId, string actorId, string action, object? before, object? after, string? reason = null)
    {
        Db.AuditLogs.Add(new AuditLog
        {
            Id = GuidGenerator.NewId(),
            EntityType = entityType,
            EntityId = entityId,
            ActorId = actorId,
            Action = action,
            At = DateTime.UtcNow,
            BeforeJson = before is null ? null : System.Text.Json.JsonSerializer.Serialize(before),
            AfterJson = after is null ? null : System.Text.Json.JsonSerializer.Serialize(after),
            Reason = reason
        });
    }
}
