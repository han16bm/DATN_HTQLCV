using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Auditing;
using Shared.Entities.Entities;
using Shared.Entities.Enums;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Dtos;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Services;

public class TaskService(ApplicationDbContext db, IHttpContextAccessor http) : BaseService(db, http), ITaskService
{
    public async Task<PagedResult<TaskDto>> ListAsync(TaskQuery query)
    {
        var q = VisibleTasks(await AccessAsync()).AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Q))
            q = q.Where(t => t.Title.Contains(query.Q));
        if (!string.IsNullOrWhiteSpace(query.ProjectId))
            q = q.Where(t => t.ProjectId == query.ProjectId);
        if (!string.IsNullOrWhiteSpace(query.AssigneeId))
            q = q.Where(t => t.AssigneeId == query.AssigneeId);
        if (query.Status.HasValue)
            q = q.Where(t => t.Status == query.Status);
        if (query.Priority.HasValue)
            q = q.Where(t => t.Priority == query.Priority);
        if (query.DueFrom.HasValue)
            q = q.Where(t => t.DueAt >= query.DueFrom);
        if (query.DueTo.HasValue)
            q = q.Where(t => t.DueAt <= query.DueTo);
        if (query.Overdue == true)
        {
            var now = DateTime.UtcNow;
            q = q.Where(t => t.DueAt < now && t.Status != WorkTaskStatus.Completed && t.Status != WorkTaskStatus.Cancelled);
        }

        q = query.Sort switch
        {
            "-dueAt" => q.OrderByDescending(t => t.DueAt),
            "updatedAt" => q.OrderBy(t => t.UpdatedAt),
            "-updatedAt" => q.OrderByDescending(t => t.UpdatedAt),
            _ => q.OrderBy(t => t.DueAt)
        };

        var paged = await q.ToPagedResultAsync(query);
        var names = await AuditActorNames.LoadAsync(Db, paged.Items.SelectMany(t => new[] { t.CreatedBy, t.UpdatedBy }));
        var items = new List<TaskDto>();
        foreach (var t in paged.Items)
            items.Add(await t.ToDtoAsync(Db, names));

        return new PagedResult<TaskDto> { Items = items, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<TaskDto> GetAsync(string taskId)
    {
        var entity = await RequireTaskAsync(taskId);
        return await entity.ToDtoAsync(Db);
    }

    public async Task<TaskDto> CreateAsync(string projectId, CreateTaskRequest request, string actorId)
    {
        var project = await (await AccessAsync()).EnsureAsync(Db, projectId, PermissionFeatures.TasksManage);
        if (project.Status != ProjectStatus.Active)
            throw new BusinessRuleException("Dự án chưa ở trạng thái Đang thực hiện.");
        if (request.DueAt <= DateTime.UtcNow)
            throw new ValidationException("Hạn công việc phải ở tương lai.");
        if (request.DueAt > project.DueAt)
            throw new ValidationException("Hạn công việc không được vượt hạn dự án.");

        var now = DateTime.UtcNow;
        var entity = new WorkTask
        {
            Id = GuidGenerator.NewId(),
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            ProjectId = projectId,
            Title = request.Title.Trim(),
            Description = request.Description,
            AcceptanceCriteria = request.AcceptanceCriteria,
            Priority = request.Priority,
            DueAt = request.DueAt,
            OriginalDueAt = request.DueAt,
            EstimatedMinutes = request.EstimatedMinutes,
            OriginalEstimatedMinutes = request.EstimatedMinutes,
            Status = WorkTaskStatus.New,
            StatusChangedAt = now
        };

        Db.Tasks.Add(entity);
        WriteAuditLog(nameof(WorkTask), entity.Id, actorId, "CREATE", null, Clone(entity));
        await Db.SaveChangesAsync();
        return await entity.ToDtoAsync(Db);
    }

    public async Task<TaskDto> UpdateAsync(string taskId, UpdateTaskRequest request, int ifMatchVersion, string actorId)
    {
        var task = await RequireTaskAsync(taskId, PermissionFeatures.TasksManage);
        CheckVersion(task.Version, ifMatchVersion);
        EnsureNotPendingReview(task);
        if (task.Status is not (WorkTaskStatus.New or WorkTaskStatus.Todo or WorkTaskStatus.InProgress))
            throw new BusinessRuleException("Chỉ sửa được công việc Mới tạo, Chờ thực hiện hoặc Đang thực hiện.");

        var before = Clone(task);
        var planChanged = (request.DueAt.HasValue && request.DueAt != task.DueAt) ||
                           (request.EstimatedMinutes.HasValue && request.EstimatedMinutes != task.EstimatedMinutes);
        if (planChanged && task.AssigneeId is not null && string.IsNullOrWhiteSpace(request.ChangeReason))
            throw new ValidationException("Cần nêu lý do khi đổi kế hoạch công việc đã giao.");

        if (request.Title is not null) task.Title = request.Title.Trim();
        if (request.Description is not null) task.Description = request.Description;
        if (request.AcceptanceCriteria is not null) task.AcceptanceCriteria = request.AcceptanceCriteria;
        if (request.Priority.HasValue) task.Priority = request.Priority.Value;
        if (request.DueAt.HasValue) task.DueAt = request.DueAt.Value;
        if (request.EstimatedMinutes.HasValue) task.EstimatedMinutes = request.EstimatedMinutes.Value;

        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;
        WriteAuditLog(nameof(WorkTask), task.Id, actorId, "UPDATE", before, Clone(task), request.ChangeReason);
        await Db.SaveChangesAsync();
        return await task.ToDtoAsync(Db);
    }

    public async Task<TaskDto> CancelAsync(string taskId, CancelTaskRequest request, int ifMatchVersion, string actorId)
    {
        var task = await RequireTaskAsync(taskId, PermissionFeatures.TasksManage);
        CheckVersion(task.Version, ifMatchVersion);
        if (task.Status is not (WorkTaskStatus.New or WorkTaskStatus.Todo or WorkTaskStatus.InProgress))
            throw new BusinessRuleException("Chỉ hủy được công việc chưa Chờ nghiệm thu hoặc đã kết thúc.");

        var before = Clone(task);
        task.Status = WorkTaskStatus.Cancelled;
        task.CancelledAt = DateTime.UtcNow;
        task.StatusChangedAt = task.CancelledAt.Value;
        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;

        var assignment = await Db.TaskAssignments.FirstOrDefaultAsync(a => a.TaskId == taskId && a.EndedAt == null);
        if (assignment is not null) assignment.EndedAt = DateTime.UtcNow;

        WriteAuditLog(nameof(WorkTask), task.Id, actorId, "CANCEL", before, Clone(task), request.Reason);
        await Db.SaveChangesAsync();
        return await task.ToDtoAsync(Db);
    }

    public async Task<TaskDto> AssignAsync(string taskId, AssignTaskRequest request, int ifMatchVersion, string actorId)
    {
        var task = await RequireTaskAsync(taskId, PermissionFeatures.TasksManage);
        CheckVersion(task.Version, ifMatchVersion);
        EnsureNotPendingReview(task);
        if (task.Status is WorkTaskStatus.Completed or WorkTaskStatus.Cancelled)
            throw new BusinessRuleException("Công việc đã kết thúc, không thể giao lại.");

        var isHandover = task.AssigneeId is not null && task.AssigneeId != request.AssigneeId;
        if (isHandover && string.IsNullOrWhiteSpace(request.Reason))
            throw new ValidationException("Cần lý do khi bàn giao người nhận.");

        var before = Clone(task);

        if (task.AssigneeId != request.AssigneeId)
        {
            var current = await Db.TaskAssignments.FirstOrDefaultAsync(a => a.TaskId == taskId && a.EndedAt == null);
            if (current is not null) current.EndedAt = DateTime.UtcNow;

            Db.TaskAssignments.Add(new TaskAssignment
            {
                Id = GuidGenerator.NewId(),
                TaskId = taskId,
                AssigneeId = request.AssigneeId,
                AssignedBy = actorId,
                StartedAt = DateTime.UtcNow,
                Reason = request.Reason
            });

            task.AssigneeId = request.AssigneeId;
            // Giao lần đầu (từ NEW) chuyển TODO; bàn giao giữ nguyên trạng thái TODO/IN_PROGRESS hiện có.
            if (task.Status == WorkTaskStatus.New)
            {
                task.Status = WorkTaskStatus.Todo;
                task.StatusChangedAt = DateTime.UtcNow;
            }
        }

        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;
        WriteAuditLog(nameof(WorkTask), task.Id, actorId, "ASSIGN", before, Clone(task), request.Reason);
        await Db.SaveChangesAsync();
        return await task.ToDtoAsync(Db);
    }

    public async Task<TaskDto> StartAsync(string taskId, int ifMatchVersion, string actorId)
    {
        var task = await RequireTaskAsync(taskId);
        CheckVersion(task.Version, ifMatchVersion);
        if (task.AssigneeId != actorId)
            throw new ForbiddenException("Chỉ người nhận hiện tại được bắt đầu công việc.");
        if (task.Status != WorkTaskStatus.Todo)
            throw new BusinessRuleException("Chỉ bắt đầu được công việc đang Chờ thực hiện.");

        var before = Clone(task);
        task.Status = WorkTaskStatus.InProgress;
        task.FirstStartedAt ??= DateTime.UtcNow;
        task.StatusChangedAt = DateTime.UtcNow;
        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;

        WriteAuditLog(nameof(WorkTask), task.Id, actorId, "START", before, Clone(task));
        await Db.SaveChangesAsync();
        return await task.ToDtoAsync(Db);
    }

    public async Task<TaskDto> PauseAsync(string taskId, PauseTaskRequest request, int ifMatchVersion, string actorId)
    {
        var task = await RequireTaskAsync(taskId);
        CheckVersion(task.Version, ifMatchVersion);
        if (task.AssigneeId != actorId)
            throw new ForbiddenException("Chỉ người nhận hiện tại được tạm dừng công việc.");
        if (task.Status != WorkTaskStatus.InProgress)
            throw new BusinessRuleException("Chỉ tạm dừng được công việc đang thực hiện.");

        var before = Clone(task);
        task.Status = WorkTaskStatus.Todo;
        task.StatusChangedAt = DateTime.UtcNow;
        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;

        WriteAuditLog(nameof(WorkTask), task.Id, actorId, "PAUSE", before, Clone(task), request.Reason);
        await Db.SaveChangesAsync();
        return await task.ToDtoAsync(Db);
    }

    public async Task<TaskDto> UpdateRemainingEstimateAsync(string taskId, UpdateRemainingEstimateRequest request, int ifMatchVersion, string actorId)
    {
        var task = await RequireTaskAsync(taskId);
        CheckVersion(task.Version, ifMatchVersion);
        if (task.AssigneeId != actorId || task.Status != WorkTaskStatus.InProgress)
            throw new ForbiddenException("Chỉ người nhận hiện tại ở Đang thực hiện được cập nhật giờ còn lại.");

        var before = Clone(task);
        task.RemainingMinutes = request.RemainingMinutes;
        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;

        WriteAuditLog(nameof(WorkTask), task.Id, actorId, "UPDATE_REMAINING", before, Clone(task));
        await Db.SaveChangesAsync();
        return await task.ToDtoAsync(Db);
    }

    public async Task<PagedResult<AuditDto>> ListHistoryAsync(string taskId, SimplePagingQuery query)
    {
        await RequireTaskAsync(taskId);
        var q = Db.AuditLogs.AsNoTracking().Where(a => a.EntityType == nameof(WorkTask) && a.EntityId == taskId).OrderByDescending(a => a.At);
        var paged = await q.ToPagedResultAsync(query);
        var actorIds = paged.Items.Select(a => a.ActorId).Distinct().ToList();
        var actors = await Db.Users.AsNoTracking().Where(u => actorIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
        var items = paged.Items.Select(a => new AuditDto(a.Id,
            actors.TryGetValue(a.ActorId, out var actor) ? new PersonRefDto(actor.Id, actor.DisplayName) : new PersonRefDto(a.ActorId, a.ActorId),
            a.Action, a.At,
            a.BeforeJson is null ? null : System.Text.Json.JsonDocument.Parse(a.BeforeJson).RootElement,
            a.AfterJson is null ? null : System.Text.Json.JsonDocument.Parse(a.AfterJson).RootElement,
            a.Reason)).ToList();
        return new PagedResult<AuditDto> { Items = items, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    internal static void EnsureNotPendingReview(WorkTask task)
    {
        if (task.Status == WorkTaskStatus.PendingReview)
            throw new BusinessRuleException("Công việc đang Chờ nghiệm thu, không thể sửa/đổi người/ghi giờ/hủy.");
    }

    internal static void CheckVersion(int current, int ifMatch)
    {
        if (ifMatch != current)
            throw new PreconditionFailedException("Dữ liệu vừa được cập nhật, vui lòng tải lại.");
    }

    private static WorkTask Clone(WorkTask t) => new()
    {
        Id = t.Id, Version = t.Version, Title = t.Title, Description = t.Description, AcceptanceCriteria = t.AcceptanceCriteria,
        Priority = t.Priority, DueAt = t.DueAt, EstimatedMinutes = t.EstimatedMinutes, RemainingMinutes = t.RemainingMinutes,
        AssigneeId = t.AssigneeId, Status = t.Status
    };
}
