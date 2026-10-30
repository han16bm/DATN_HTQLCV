namespace Analytics.Api.Models.Dtos;

public record AlertDto
{
    public string Id { get; init; } = null!;
    public int Version { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public string ProjectId { get; init; } = null!;
    public string? TaskId { get; init; }
    public string Type { get; init; } = null!;
    public string Severity { get; init; } = null!;
    public string Status { get; init; } = null!;
    public bool ConditionActive { get; init; }
    public List<string> Evidence { get; init; } = [];
    public DateTime DataAsOf { get; init; }
    public string MethodVersion { get; init; } = null!;
    public string? ResolutionNote { get; init; }
    public string? HandledBy { get; init; }
    public DateTime? HandledAt { get; init; }
    public string? TaskTitle { get; init; }
    public AnalysisRefDto? AnalysisRef { get; init; }
}
