using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Tasks.Api.Services;

public record NotificationDto(string Id, string Type, string Title, string Href, DateTime CreatedAt, DateTime? ReadAt);
public record NotificationSummaryDto(int UnreadCount);
public record NotificationReadDto(string Id, DateTime ReadAt);
public record ReadNotificationRequest(bool Read);

/// <summary>
/// Chuông thông báo (FE/fe-specs/api/NOTIFICATIONS.md): người nhận lấy từ phiên, chỉ còn thấy
/// thông báo của công việc mình vẫn được xem; đọc ID của người khác hoặc không còn thấy → 404.
/// </summary>
public class NotificationService(ApplicationDbContext db, IHttpContextAccessor http) : BaseService(db, http)
{
    private static readonly Dictionary<string, string> Text = new()
    {
        ["TASK_ASSIGNED"] = "Bạn được giao công việc",
        ["TASK_UPDATED"] = "Kế hoạch công việc đã thay đổi",
        ["RESULT_SUBMITTED"] = "Có kết quả mới cần nghiệm thu",
        ["RESULT_APPROVED"] = "Kết quả đã được chấp nhận",
        ["CHANGES_REQUESTED"] = "Kết quả cần chỉnh sửa",
        ["ALERT_CREATED"] = "Có cảnh báo mới cho công việc",
    };

    private async Task<IQueryable<Notification>> VisibleAsync()
    {
        var access = await AccessAsync();
        var tasks = VisibleTasks(access);
        var uid = access.UserId;
        return Db.Notifications.Where(n => n.RecipientId == uid && tasks.Any(t => t.Id == n.TaskId));
    }

    public async Task<PagedResult<NotificationDto>> ListAsync(PagingQuery query)
    {
        var paged = await (await VisibleAsync()).AsNoTracking()
            .OrderByDescending(n => n.CreatedAt)
            .ToPagedResultAsync(query);
        var taskIds = paged.Items.Select(n => n.TaskId).Distinct().ToList();
        var titles = await Db.Tasks.AsNoTracking().Where(t => taskIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id, t => t.Title);
        var items = paged.Items.Select(n => new NotificationDto(
            n.Id, n.Type,
            $"{Text.GetValueOrDefault(n.Type, "Thông báo")}: {titles.GetValueOrDefault(n.TaskId, n.TaskId)}",
            n.AlertId is not null
                ? $"/alerts/{n.AlertId}"
                : $"/tasks/{n.TaskId}{(n.SubmissionId is null ? "" : $"/submissions/{n.SubmissionId}")}",
            n.CreatedAt, n.ReadAt)).ToList();
        return new PagedResult<NotificationDto> { Items = items, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<NotificationSummaryDto> SummaryAsync() =>
        new(await (await VisibleAsync()).CountAsync(n => n.ReadAt == null));

    // Chỉ chuyển chưa đọc → đã đọc; gọi lại không đổi readAt.
    public async Task<NotificationReadDto> MarkReadAsync(string notificationId, ReadNotificationRequest request)
    {
        if (!request.Read)
            throw new ValidationException("Chỉ hỗ trợ đánh dấu đã đọc.");
        var notice = await (await VisibleAsync()).FirstOrDefaultAsync(n => n.Id == notificationId)
            ?? throw new NotFoundException("Không tìm thấy thông báo.");
        // Làm tròn tới micro giây như Postgres lưu, để lần gọi lại trả đúng cùng readAt.
        var now = DateTime.UtcNow;
        notice.ReadAt ??= new DateTime(now.Ticks - now.Ticks % 10, DateTimeKind.Utc);
        await Db.SaveChangesAsync();
        return new NotificationReadDto(notice.Id, notice.ReadAt.Value);
    }
}
