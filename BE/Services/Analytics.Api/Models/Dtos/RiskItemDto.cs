namespace Analytics.Api.Models.Dtos;

public record RiskItemDto
{
    public string TaskId { get; init; } = null!;
    public string TaskTitle { get; init; } = null!;
    public string Status { get; init; } = null!;
    public string? AssigneeId { get; init; }
    public DateTime DueAt { get; init; }
    public string Category { get; init; } = null!; // AT_RISK | OVERDUE | NO_SIGNAL
    public string RiskLevel { get; init; } = null!; // LOW | MEDIUM | HIGH
    public string AssessmentBasis { get; init; } = "BUSINESS_RULES";
    public QualityDto Quality { get; init; } = new();
}
