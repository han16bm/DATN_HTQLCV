using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class Alert
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string ProjectId { get; set; } = null!;
    public string? TaskId { get; set; }
    public AlertType Type { get; set; }
    public AlertSeverity Severity { get; set; }
    public AlertStatus Status { get; set; }
    public bool ConditionActive { get; set; }
    public List<string> Evidence { get; set; } = [];
    public DateTime DataAsOf { get; set; }
    public string MethodVersion { get; set; } = null!;

    public string? ResolutionNote { get; set; }
    public string? HandledBy { get; set; }
    public DateTime? HandledAt { get; set; }
}
