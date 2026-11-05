using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class Submission
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string TaskId { get; set; } = null!;
    public int Sequence { get; set; }
    public string SubmittedBy { get; set; } = null!;
    public DateTime SubmittedAt { get; set; }
    public string Summary { get; set; } = null!;
    public List<string> Links { get; set; } = [];
    public List<string> AttachmentIds { get; set; } = [];
    public DateTime DueAtSnapshot { get; set; }
    public int ActualMinutesSnapshot { get; set; }

    public SubmissionStatus Status { get; set; }
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewComment { get; set; }
    public string? RequestedChanges { get; set; }

    public WorkTask? Task { get; set; }
}
