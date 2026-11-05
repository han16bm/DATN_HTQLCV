using Shared.Entities.Enums;

namespace Tasks.Api.Models.Requests;

public record CreateTaskRequest
{
    public required string Title { get; init; }
    public string? Description { get; init; }
    public required string AcceptanceCriteria { get; init; }
    public required TaskPriority Priority { get; init; }
    public required DateTime DueAt { get; init; }
    public required int EstimatedMinutes { get; init; }
}

public record UpdateTaskRequest
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string? AcceptanceCriteria { get; init; }
    public TaskPriority? Priority { get; init; }
    public DateTime? DueAt { get; init; }
    public int? EstimatedMinutes { get; init; }
    public string? ChangeReason { get; init; }
}

public record AssignTaskRequest(string AssigneeId, string? Reason);

public record PauseTaskRequest(string Reason);

public record CancelTaskRequest(string Reason);

public record UpdateRemainingEstimateRequest(int RemainingMinutes);
