using Shared.Entities.Enums;

namespace Tasks.Api.Models.Dtos;

public record ReportItemDto(string TaskId, string Title, WorkTaskStatus Status, int Minutes);

public record ReportPreviewDto
{
    public required string ProjectId { get; init; }
    public required PeriodType PeriodType { get; init; }
    public required DateOnly PeriodStart { get; init; }
    public required DateTime PeriodEndExclusive { get; init; }
    public required DateTime DataAsOf { get; init; }
    public required int TotalMinutes { get; init; }
    public required List<ReportItemDto> Items { get; init; }
    public required bool PartialPeriod { get; init; }
}

public record ReportDto
{
    public required string Id { get; init; }
    public required int Version { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public required string ProjectId { get; init; }
    public required PeriodType PeriodType { get; init; }
    public required DateOnly PeriodStart { get; init; }
    public required string AuthorId { get; init; }
    public required ReportStatus Status { get; init; }
    public required string Achievements { get; init; }
    public required string Blockers { get; init; }
    public required string NextPlan { get; init; }
    public required List<string> SelectedTaskIds { get; init; }
    public string? ZeroTimeReason { get; init; }
    public DateTime? SubmittedAt { get; init; }
    public ReportPreviewDto? Snapshot { get; init; }
    public required PersonRefDto Author { get; init; }
}

public record AuditDto(string Id, string EntityType, string EntityId, string ActorId, string Action, DateTime At, object? Before, object? After, string? Reason);
