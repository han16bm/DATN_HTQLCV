using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class WorkTask
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string ProjectId { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string AcceptanceCriteria { get; set; } = null!;
    public TaskPriority Priority { get; set; }

    public DateTime DueAt { get; set; }
    public DateTime OriginalDueAt { get; set; }
    public int EstimatedMinutes { get; set; }
    public int OriginalEstimatedMinutes { get; set; }
    public int? RemainingMinutes { get; set; }

    public string? AssigneeId { get; set; }
    public WorkTaskStatus Status { get; set; }
    public DateTime StatusChangedAt { get; set; }
    public DateTime? FirstStartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public string? LatestSubmissionId { get; set; }

    public Project? Project { get; set; }
    public List<TaskAssignment> Assignments { get; set; } = [];
    public List<TimeLog> TimeLogs { get; set; } = [];
    public List<Submission> Submissions { get; set; } = [];
    public List<Attachment> Attachments { get; set; } = [];
}
