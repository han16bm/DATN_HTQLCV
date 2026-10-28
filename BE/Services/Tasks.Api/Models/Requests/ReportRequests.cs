using Shared.Entities.Enums;

namespace Tasks.Api.Models.Requests;

public record CreateReportDraftRequest
{
    public required string ProjectId { get; init; }
    public required PeriodType PeriodType { get; init; }
    public required DateOnly PeriodStart { get; init; }
    public string? Achievements { get; init; }
    public string? Blockers { get; init; }
    public string? NextPlan { get; init; }
    public List<string>? SelectedTaskIds { get; init; }
}

public record UpdateReportDraftRequest
{
    public string? Achievements { get; init; }
    public string? Blockers { get; init; }
    public string? NextPlan { get; init; }
    public List<string>? SelectedTaskIds { get; init; }
    public string? ZeroTimeReason { get; init; }
}

public record SubmitReportRequest(string? ZeroTimeReason);
