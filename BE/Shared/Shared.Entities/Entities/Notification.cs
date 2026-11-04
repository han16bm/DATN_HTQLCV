using Shared.Commons.Utils;

namespace Shared.Entities.Entities;

/// <summary>
/// Thông báo cá nhân trong ứng dụng (FE/fe-specs/api/NOTIFICATIONS.md): ghi cùng giao dịch nghiệp vụ,
/// tiêu đề và đường dẫn suy ra lúc đọc từ công việc/lần nộp/cảnh báo đích.
/// </summary>
public class Notification
{
    public string Id { get; set; } = null!;
    public string RecipientId { get; set; } = null!;
    // TASK_ASSIGNED | TASK_UPDATED | RESULT_SUBMITTED | RESULT_APPROVED | CHANGES_REQUESTED | ALERT_CREATED
    public string Type { get; set; } = null!;
    public string TaskId { get; set; } = null!;
    public string? SubmissionId { get; set; }
    public string? AlertId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

public static class NotificationExtensions
{
    /// <summary>Thêm thông báo vào cùng SaveChanges của thao tác nghiệp vụ (rollback thì không còn thông báo).</summary>
    public static void Notify(this ApplicationDbContext db, string recipientId, string type, string taskId,
        string? submissionId = null, string? alertId = null) =>
        db.Notifications.Add(new Notification
        {
            Id = GuidGenerator.NewId(),
            RecipientId = recipientId,
            Type = type,
            TaskId = taskId,
            SubmissionId = submissionId,
            AlertId = alertId,
            CreatedAt = DateTime.UtcNow,
        });
}
