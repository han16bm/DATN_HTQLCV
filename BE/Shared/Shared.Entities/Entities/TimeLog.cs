using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class TimeLog
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string TaskId { get; set; } = null!;
    public string UserId { get; set; } = null!;
    public DateOnly WorkDate { get; set; }
    public int Minutes { get; set; }
    public string Description { get; set; } = null!;
    public TimeLogStatus Status { get; set; }
    public string? VoidReason { get; set; }

    public WorkTask? Task { get; set; }
    public User? User { get; set; }
}
