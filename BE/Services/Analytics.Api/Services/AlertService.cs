using Shared.Entities.Authorization;
using Analytics.Api.Interfaces;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Analytics.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Entities;
using Shared.Entities.Auditing;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Analytics.Api.Services;

public class AlertService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor) : IAlertService
{
    public async Task<PagedResult<AlertDto>> ListAsync(AlertQuery query)
    {
        var q = await VisibleAlertsAsync();
        if (!string.IsNullOrWhiteSpace(query.ProjectId)) q = q.Where(a => a.ProjectId == query.ProjectId);
        if (query.Status.HasValue) q = q.Where(a => a.Status == query.Status);
        if (query.Severity.HasValue) q = q.Where(a => a.Severity == query.Severity);

        q = q.OrderByDescending(a => a.CreatedAt);

        var paged = await q.ToPagedResultAsync(query);
        var titles = await LoadTaskTitlesAsync(paged.Items.Select(a => a.TaskId));
        var names = await AuditActorNames.LoadAsync(context, paged.Items.SelectMany(a => new[] { a.CreatedBy, a.UpdatedBy, a.HandledBy }));
        return new PagedResult<AlertDto>
        {
            Items = paged.Items.Select(a => ToDto(a, ResolveTaskTitle(a.TaskId, titles), names)).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            Total = paged.Total
        };
    }

    public async Task<AlertDto> GetAsync(string alertId)
    {
        var alert = await (await VisibleAlertsAsync()).FirstOrDefaultAsync(a => a.Id == alertId)
            ?? throw new NotFoundException("Không tìm thấy cảnh báo.");
        var titles = await LoadTaskTitlesAsync([alert.TaskId]);
        var names = await AuditActorNames.LoadAsync(context, [alert.CreatedBy, alert.UpdatedBy, alert.HandledBy]);
        var actor = await GetActorAsync();
        return ToDto(alert, ResolveTaskTitle(alert.TaskId, titles), names) with
        {
            CanHandle = actor.IsSysAdmin || await IsRecipientAsync(alert, actor.Id)
        };
    }

    public async Task<AlertDto> UpdateAsync(string alertId, UpdateAlertRequest request, string? ifMatch)
    {
        if (string.IsNullOrWhiteSpace(ifMatch))
            throw new PreconditionRequiredException("Thiếu If-Match.");

        if (request.Status != AlertStatus.Read && string.IsNullOrWhiteSpace(request.ResolutionNote))
            throw new ValidationException("Cần nhập hướng xử lý/lý do khi đổi trạng thái khác Đã xem.");

        var alert = await context.Alerts.FirstOrDefaultAsync(a => a.Id == alertId)
            ?? throw new NotFoundException("Không tìm thấy cảnh báo.");

        if (!int.TryParse(ifMatch.Trim('"'), out var version) || version != alert.Version)
            throw new PreconditionFailedException("Cảnh báo vừa được cập nhật, hãy tải lại.");

        var actor = await GetActorAsync();
        if (!actor.IsSysAdmin && !await IsRecipientAsync(alert, actor.Id))
        {
            if (await (await VisibleAlertsAsync()).AnyAsync(a => a.Id == alertId))
                throw new ForbiddenException("Chỉ người được giao công việc hoặc quản lý dự án mới được xử lý cảnh báo này.");
            throw new NotFoundException("Không tìm thấy cảnh báo.");
        }
        var actorId = actor.Id;

        alert.Status = request.Status;
        alert.ResolutionNote = request.ResolutionNote;
        alert.HandledBy = actorId;
        alert.HandledAt = DateTime.UtcNow;
        alert.Version++;
        alert.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        var titles = await LoadTaskTitlesAsync([alert.TaskId]);
        var names = await AuditActorNames.LoadAsync(context, [alert.CreatedBy, alert.UpdatedBy, alert.HandledBy]);
        return ToDto(alert, ResolveTaskTitle(alert.TaskId, titles), names) with { CanHandle = true };
    }

    // Cảnh báo là thông báo cá nhân: người nhận = người được giao task + người có ALERTS_MANAGE trong dự án.
    // Sysadmin và người có ANALYTICS_VIEW được xem tất cả (chỉ sysadmin được xử lý thay).
    private async Task<IQueryable<Alert>> VisibleAlertsAsync()
    {
        var actor = await GetActorAsync();
        var q = context.Alerts.AsNoTracking();
        if (await PermissionEvaluator.HasPermissionAsync(context, actor, PermissionFeatures.AnalyticsView))
            return q;
        var managed = await ManagedProjectIdsAsync(actor.Id);
        return q.Where(a => managed.Contains(a.ProjectId)
            || context.Tasks.Any(t => t.Id == a.TaskId && t.AssigneeId == actor.Id));
    }

    private async Task<bool> IsRecipientAsync(Alert alert, string userId) =>
        (await ManagedProjectIdsAsync(userId)).Contains(alert.ProjectId)
        || (alert.TaskId != null && await context.Tasks.AnyAsync(t => t.Id == alert.TaskId && t.AssigneeId == userId));

    private async Task<List<string>> ManagedProjectIdsAsync(string userId) =>
        (await ProjectAccess.LoadAsync(context, userId)).ProjectIdsWith(PermissionFeatures.AlertsManage).ToList();

    private async Task<User> GetActorAsync()
    {
        var actorId = httpContextAccessor.HttpContext?.GetUserId()
            ?? throw new ValidationException("Thiếu định danh người xử lý trong phiên.");
        return await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actorId)
            ?? throw new ForbiddenException("Tài khoản không còn tồn tại.");
    }

    private async Task<Dictionary<string, string>> LoadTaskTitlesAsync(IEnumerable<string?> taskIds)
    {
        var ids = taskIds.Where(id => id != null).Select(id => id!).Distinct().ToList();
        return await context.Tasks.AsNoTracking().Where(t => ids.Contains(t.Id)).ToDictionaryAsync(t => t.Id, t => t.Title);
    }

    private static string? ResolveTaskTitle(string? taskId, Dictionary<string, string> titles)
    {
        if (taskId is null) return null;
        return titles.TryGetValue(taskId, out var title) ? title : null;
    }

    private static AlertDto ToDto(Alert a, string? taskTitle, Dictionary<string, string> names)
    {
        return new()
        {
            Id = a.Id,
            Version = a.Version,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt,
            ProjectId = a.ProjectId,
            TaskId = a.TaskId,
            Type = a.Type.ToUpperSnake(),
            Severity = a.Severity.ToUpperSnake(),
            Status = a.Status.ToUpperSnake(),
            ConditionActive = a.ConditionActive,
            Evidence = a.Evidence,
            DataAsOf = a.DataAsOf,
            MethodVersion = a.MethodVersion,
            ResolutionNote = a.ResolutionNote,
            Handler = a.HandledBy is null ? null : new PersonRefDto(a.HandledBy, AuditActorNames.Label(a.HandledBy, names)!),
            HandledAt = a.HandledAt,
            TaskTitle = taskTitle,
            AnalysisRef = null,
            CreatedBy = a.CreatedBy is null ? null : new RefDto(a.CreatedBy, AuditActorNames.Label(a.CreatedBy, names)!),
            UpdatedBy = a.UpdatedBy is null ? null : new RefDto(a.UpdatedBy, AuditActorNames.Label(a.UpdatedBy, names)!)
        };
    }
}
