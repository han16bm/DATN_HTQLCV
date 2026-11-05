using Shared.Commons.Models;
using Shared.Entities.Enums;

namespace Tasks.Api.Models.Queries;

public record TaskQuery : PagingQuery
{
    public string? Q { get; init; }
    public string? ProjectId { get; init; }
    public string? AssigneeId { get; init; }
    public WorkTaskStatus? Status { get; init; }
    public TaskPriority? Priority { get; init; }
    public bool? Overdue { get; init; }
    public DateTime? DueFrom { get; init; }
    public DateTime? DueTo { get; init; }
    public string Sort { get; init; } = "dueAt";
}

public record SimplePagingQuery : PagingQuery
{
    public string? Q { get; init; }
}

public record ReviewQueueQuery : PagingQuery
{
    public string? Q { get; init; }
    public string? ProjectId { get; init; }
}

public record ReportQuery : PagingQuery
{
    public string? Q { get; init; }
    public string? ProjectId { get; init; }
    public string? AuthorId { get; init; }
    public PeriodType? PeriodType { get; init; }
    public ReportStatus? Status { get; init; }
    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }
}

public record ReportPreviewQuery(string ProjectId, PeriodType PeriodType, DateOnly PeriodStart);
