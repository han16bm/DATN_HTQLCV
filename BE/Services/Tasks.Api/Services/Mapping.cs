using Shared.Entities;
using Shared.Entities.Entities;
using Tasks.Api.Models.Dtos;

namespace Tasks.Api.Services;

/// <summary>Chuyển entity sang DTO; tra nhãn người/dự án qua cùng DbContext dùng chung giữa các service.</summary>
public static class Mapping
{
    public static async Task<PersonRefDto> PersonRefAsync(this ApplicationDbContext db, string userId)
    {
        var user = await db.Users.FindAsync(userId);
        return new PersonRefDto(userId, user?.DisplayName ?? userId);
    }

    public static async Task<EntityLabelDto> ProjectLabelAsync(this ApplicationDbContext db, string projectId)
    {
        var project = await db.Projects.FindAsync(projectId);
        return new EntityLabelDto(projectId, project?.Name ?? projectId);
    }

    public static async Task<TaskDto> ToDtoAsync(this WorkTask t, ApplicationDbContext db)
    {
        var now = DateTime.UtcNow;
        return new TaskDto
        {
            Id = t.Id,
            Version = t.Version,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            ProjectId = t.ProjectId,
            Title = t.Title,
            Description = t.Description,
            AcceptanceCriteria = t.AcceptanceCriteria,
            Priority = t.Priority,
            DueAt = t.DueAt,
            OriginalDueAt = t.OriginalDueAt,
            EstimatedMinutes = t.EstimatedMinutes,
            OriginalEstimatedMinutes = t.OriginalEstimatedMinutes,
            RemainingMinutes = t.RemainingMinutes,
            AssigneeId = t.AssigneeId,
            Status = t.Status,
            StatusChangedAt = t.StatusChangedAt,
            FirstStartedAt = t.FirstStartedAt,
            CompletedAt = t.CompletedAt,
            CancelledAt = t.CancelledAt,
            ActualMinutes = db.TimeLogs.Where(l => l.TaskId == t.Id && l.Status == Shared.Entities.Enums.TimeLogStatus.Active).Sum(l => (int?)l.Minutes) ?? 0,
            LatestSubmissionId = t.LatestSubmissionId,
            IsOverdue = t.Status is not (Shared.Entities.Enums.WorkTaskStatus.Completed or Shared.Entities.Enums.WorkTaskStatus.Cancelled) && t.DueAt < now,
            Assignee = t.AssigneeId is null ? null : await db.PersonRefAsync(t.AssigneeId),
            Project = await db.ProjectLabelAsync(t.ProjectId)
        };
    }

    public static async Task<TimeLogDto> ToDtoAsync(this TimeLog l, ApplicationDbContext db)
    {
        return new()
        {
            Id = l.Id,
            Version = l.Version,
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt,
            TaskId = l.TaskId,
            UserId = l.UserId,
            WorkDate = l.WorkDate,
            Minutes = l.Minutes,
            Description = l.Description,
            Status = l.Status,
            VoidReason = l.VoidReason,
            User = await db.PersonRefAsync(l.UserId)
        };
    }

    public static async Task<SubmissionDto> ToDtoAsync(this Submission s, ApplicationDbContext db)
    {
        return new()
        {
            Id = s.Id,
            Version = s.Version,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt,
            TaskId = s.TaskId,
            Sequence = s.Sequence,
            SubmittedBy = s.SubmittedBy,
            SubmittedAt = s.SubmittedAt,
            Summary = s.Summary,
            Links = s.Links,
            AttachmentIds = s.AttachmentIds,
            DueAtSnapshot = s.DueAtSnapshot,
            ActualMinutesSnapshot = s.ActualMinutesSnapshot,
            Status = s.Status,
            ReviewedBy = s.ReviewedBy,
            ReviewedAt = s.ReviewedAt,
            ReviewComment = s.ReviewComment,
            RequestedChanges = s.RequestedChanges,
            Submitter = await db.PersonRefAsync(s.SubmittedBy),
            Reviewer = s.ReviewedBy is null ? null : await db.PersonRefAsync(s.ReviewedBy)
        };
    }

    public static AttachmentDto ToDto(this Attachment a)
    {
        return new()
        {
            Id = a.Id,
            Version = a.Version,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt,
            TaskId = a.TaskId,
            UploadedBy = a.UploadedBy,
            Filename = a.Filename,
            MimeType = a.MimeType,
            SizeBytes = a.SizeBytes,
            Status = a.Status
        };
    }

    public static async Task<ReportDto> ToDtoAsync(this Report r, ApplicationDbContext db)
    {
        return new()
        {
            Id = r.Id,
            Version = r.Version,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            ProjectId = r.ProjectId,
            PeriodType = r.PeriodType,
            PeriodStart = r.PeriodStart,
            AuthorId = r.AuthorId,
            Status = r.Status,
            Achievements = r.Achievements,
            Blockers = r.Blockers,
            NextPlan = r.NextPlan,
            SelectedTaskIds = r.SelectedTaskIds,
            ZeroTimeReason = r.ZeroTimeReason,
            SubmittedAt = r.SubmittedAt,
            Snapshot = r.SnapshotJson is null ? null : System.Text.Json.JsonSerializer.Deserialize<ReportPreviewDto>(r.SnapshotJson),
            Author = await db.PersonRefAsync(r.AuthorId)
        };
    }
}
