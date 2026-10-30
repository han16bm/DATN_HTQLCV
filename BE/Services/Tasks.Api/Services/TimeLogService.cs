using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Dtos;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Services;

public class TimeLogService(ApplicationDbContext db) : BaseService(db), ITimeLogService
{
    private const int MinutesPerDayLimit = 1440;

    public async Task<PagedResult<TimeLogDto>> ListAsync(string taskId, SimplePagingQuery query)
    {
        var q = Db.TimeLogs.AsNoTracking().Where(l => l.TaskId == taskId).OrderByDescending(l => l.WorkDate);
        var paged = await q.ToPagedResultAsync(query);
        var items = new List<TimeLogDto>();
        foreach (var l in paged.Items) items.Add(await l.ToDtoAsync(Db));
        return new PagedResult<TimeLogDto> { Items = items, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<TimeLogMutationResult> CreateAsync(string taskId, CreateTimeLogRequest request, int ifMatchVersion, string actorId)
    {
        var task = await Db.Tasks.FirstOrDefaultAsync(t => t.Id == taskId) ?? throw new NotFoundException("Không tìm thấy công việc.");
        TaskService.CheckVersion(task.Version, ifMatchVersion);
        if (task.AssigneeId != actorId || task.Status != WorkTaskStatus.InProgress)
            throw new ForbiddenException("Chỉ người nhận hiện tại ở Đang thực hiện được ghi thời gian.");
        if (request.Minutes <= 0 || request.Minutes > MinutesPerDayLimit)
            throw new ValidationException("Số phút phải trong khoảng 1–1440.");

        await EnsureDailyLimitAsync(actorId, request.WorkDate, request.Minutes, excludeLogId: null);

        var now = DateTime.UtcNow;
        var entity = new TimeLog
        {
            Id = GuidGenerator.NewId(),
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            TaskId = taskId,
            UserId = actorId,
            WorkDate = request.WorkDate,
            Minutes = request.Minutes,
            Description = request.Description,
            Status = TimeLogStatus.Active
        };

        Db.TimeLogs.Add(entity);
        task.Version++;
        task.UpdatedAt = now;
        WriteAuditLog(nameof(TimeLog), entity.Id, actorId, "CREATE", null, new { entity.TaskId, entity.UserId, entity.WorkDate, entity.Minutes, entity.Description, entity.Status });
        await Db.SaveChangesAsync();

        return new TimeLogMutationResult(await entity.ToDtoAsync(Db), await task.ToDtoAsync(Db));
    }

    public async Task<TimeLogMutationResult> UpdateAsync(string timeLogId, UpdateTimeLogRequest request, int ifMatchVersion, string actorId)
    {
        var log = await Db.TimeLogs.FirstOrDefaultAsync(l => l.Id == timeLogId) ?? throw new NotFoundException("Không tìm thấy nhật ký.");
        TaskService.CheckVersion(log.Version, ifMatchVersion);
        if (log.Status != TimeLogStatus.Active || log.UserId != actorId)
            throw new ForbiddenException("Chỉ sửa được nhật ký còn hiệu lực của chính mình.");

        var task = await Db.Tasks.FirstOrDefaultAsync(t => t.Id == log.TaskId) ?? throw new NotFoundException("Không tìm thấy công việc.");
        if (task.AssigneeId != actorId || task.Status != WorkTaskStatus.InProgress)
            throw new BusinessRuleException("Công việc không còn Đang thực hiện với người nhận này.");

        var newMinutes = request.Minutes ?? log.Minutes;
        var newDate = request.WorkDate ?? log.WorkDate;
        if (newMinutes <= 0 || newMinutes > MinutesPerDayLimit)
            throw new ValidationException("Số phút phải trong khoảng 1–1440.");

        await EnsureDailyLimitAsync(actorId, newDate, newMinutes, excludeLogId: log.Id);

        var before = new TimeLog { Minutes = log.Minutes, WorkDate = log.WorkDate, Description = log.Description };
        log.WorkDate = newDate;
        log.Minutes = newMinutes;
        if (request.Description is not null) log.Description = request.Description;
        log.Version++;
        log.UpdatedAt = DateTime.UtcNow;

        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;

        WriteAuditLog(nameof(TimeLog), log.Id, actorId, "UPDATE", before, new { log.WorkDate, log.Minutes, log.Description, log.Status }, request.Reason);
        await Db.SaveChangesAsync();

        return new TimeLogMutationResult(await log.ToDtoAsync(Db), await task.ToDtoAsync(Db));
    }

    public async Task<TimeLogMutationResult> VoidAsync(string timeLogId, VoidTimeLogRequest request, int ifMatchVersion, string actorId)
    {
        var log = await Db.TimeLogs.FirstOrDefaultAsync(l => l.Id == timeLogId) ?? throw new NotFoundException("Không tìm thấy nhật ký.");
        TaskService.CheckVersion(log.Version, ifMatchVersion);
        if (log.UserId != actorId)
            throw new ForbiddenException("Chỉ chủ nhật ký được loại khỏi tổng.");

        var task = await Db.Tasks.FirstOrDefaultAsync(t => t.Id == log.TaskId) ?? throw new NotFoundException("Không tìm thấy công việc.");
        if (task.AssigneeId != actorId || task.Status != WorkTaskStatus.InProgress)
            throw new BusinessRuleException("Công việc không còn Đang thực hiện với người nhận này.");

        log.Status = TimeLogStatus.Void;
        log.VoidReason = request.Reason;
        log.Version++;
        log.UpdatedAt = DateTime.UtcNow;

        task.Version++;
        task.UpdatedAt = DateTime.UtcNow;

        WriteAuditLog(nameof(TimeLog), log.Id, actorId, "VOID", null, new { log.Status, log.VoidReason }, request.Reason);
        await Db.SaveChangesAsync();

        return new TimeLogMutationResult(await log.ToDtoAsync(Db), await task.ToDtoAsync(Db));
    }

    /// <summary>Giới hạn 1440 phút/người/ngày tính trên TOÀN BỘ task, không chỉ task hiện tại.</summary>
    private async Task EnsureDailyLimitAsync(string userId, DateOnly workDate, int newMinutes, string? excludeLogId)
    {
        var existing = await Db.TimeLogs
            .Where(l => l.UserId == userId && l.WorkDate == workDate && l.Status == TimeLogStatus.Active && l.Id != excludeLogId)
            .SumAsync(l => (int?)l.Minutes) ?? 0;

        if (existing + newMinutes > MinutesPerDayLimit)
            throw new BusinessRuleException("Tổng số phút trong ngày vượt quá 1440 phút.");
    }
}
