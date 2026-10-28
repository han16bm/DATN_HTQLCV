namespace Analytics.Api.Models.Dtos;

public record DashboardDto
{
    public QualityDto Quality { get; init; } = new();
    public int TotalTasks { get; init; }
    public int CompletedTasks { get; init; }
    public int CancelledTasks { get; init; }
    public int OpenTasks { get; init; }
    public int OverdueTasks { get; init; }
    public decimal? CompletionRate { get; init; }
    public int ActualMinutes { get; init; }
    public List<StatusCountDto> ByStatus { get; init; } = [];
}

public record StatusCountDto
{
    public string Status { get; init; } = null!;
    public int Count { get; init; }
}
