using Shared.Entities.Auditing;

namespace Shared.Entities.Entities;

public class BackgroundJob : IUpdateStamped
{
    public string Code { get; set; } = null!;
    public int Version { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsEnabled { get; set; }
    public int IntervalMinutes { get; set; }
    [NoAuditStamp]
    public DateTime? LastRunAt { get; set; }
    [NoAuditStamp]
    public DateTime? NextRunAt { get; set; }
    [NoAuditStamp]
    public string? LastStatus { get; set; }
}

public class JobRun
{
    public string Id { get; set; } = null!;
    public string JobCode { get; set; } = null!;
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string Status { get; set; } = null!;
    public string Trigger { get; set; } = null!;
    public string? TriggeredBy { get; set; }
    public string? SummaryJson { get; set; }
    public string? Error { get; set; }

    public BackgroundJob? Job { get; set; }
}
