using Shared.Entities.Enums;

namespace Tasks.Api.Models.Dtos;

public record TaskDto
{
    public required string Id { get; init; }
    public required int Version { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public required string ProjectId { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public required string AcceptanceCriteria { get; init; }
    public required TaskPriority Priority { get; init; }
    public required DateTime DueAt { get; init; }
    public required DateTime OriginalDueAt { get; init; }
    public required int EstimatedMinutes { get; init; }
    public required int OriginalEstimatedMinutes { get; init; }
    public int? RemainingMinutes { get; init; }
    public string? AssigneeId { get; init; }
    public required WorkTaskStatus Status { get; init; }
    public required DateTime StatusChangedAt { get; init; }
    public DateTime? FirstStartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public DateTime? CancelledAt { get; init; }
    public required int ActualMinutes { get; init; }
    public string? LatestSubmissionId { get; init; }
    public required bool IsOverdue { get; init; }
    public PersonRefDto? Assignee { get; init; }
    public required EntityLabelDto Project { get; init; }
    public RefDto? CreatedBy { get; init; }
    public RefDto? UpdatedBy { get; init; }
}
