using Shared.Entities.Enums;

namespace Tasks.Api.Models.Dtos;

public record TimeLogDto
{
    public required string Id { get; init; }
    public required int Version { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public required string TaskId { get; init; }
    public required string UserId { get; init; }
    public required DateOnly WorkDate { get; init; }
    public required int Minutes { get; init; }
    public required string Description { get; init; }
    public required TimeLogStatus Status { get; init; }
    public string? VoidReason { get; init; }
    public required PersonRefDto User { get; init; }
}

public record TimeLogMutationResult(TimeLogDto TimeLog, TaskDto Task);
