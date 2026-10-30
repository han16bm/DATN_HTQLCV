using Shared.Entities.Enums;

namespace Tasks.Api.Models.Dtos;

public record SubmissionDto
{
    public required string Id { get; init; }
    public required int Version { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public required string TaskId { get; init; }
    public required int Sequence { get; init; }
    public required string SubmittedBy { get; init; }
    public required DateTime SubmittedAt { get; init; }
    public required string Summary { get; init; }
    public required List<string> Links { get; init; }
    public required List<string> AttachmentIds { get; init; }
    public required DateTime DueAtSnapshot { get; init; }
    public required int ActualMinutesSnapshot { get; init; }
    public required SubmissionStatus Status { get; init; }
    public string? ReviewedBy { get; init; }
    public DateTime? ReviewedAt { get; init; }
    public string? ReviewComment { get; init; }
    public string? RequestedChanges { get; init; }
    public required PersonRefDto Submitter { get; init; }
    public PersonRefDto? Reviewer { get; init; }
}

public record SubmissionMutationResult(SubmissionDto Submission, TaskDto Task);

public record ReviewQueueItemDto(
    string Id,
    string TaskId,
    string TaskTitle,
    int Sequence,
    PersonRefDto Submitter,
    DateTime SubmittedAt,
    DateTime DueAtSnapshot);
