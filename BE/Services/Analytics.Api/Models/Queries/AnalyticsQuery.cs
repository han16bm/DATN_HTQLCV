using Shared.Entities.Enums;

namespace Analytics.Api.Models.Queries;

/// <summary>Query chung cho dashboard/risks/workload/bottlenecks — cùng field lọc theo API_CATALOG.md.</summary>
public record AnalyticsQuery
{
    public string? UnitId { get; set; }
    public string? ProjectId { get; set; }
    public string? OwnerId { get; set; }
    public string? AssigneeId { get; set; }
    public WorkTaskStatus? Status { get; set; }
    public TaskPriority? Priority { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public string? TeamId { get; set; }
}
