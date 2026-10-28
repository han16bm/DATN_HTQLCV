namespace Analytics.Api.Models.Dtos;

public record BottleneckItemDto
{
    public string TaskId { get; init; } = null!;
    public string TaskTitle { get; init; } = null!;
    public string Stage { get; init; } = null!; // TODO | IN_PROGRESS | PENDING_REVIEW
    public double ElapsedMinutes { get; init; }
    public int RevisionCount { get; init; }
    public string CalendarBasis { get; init; } = "CONTINUOUS";
}
