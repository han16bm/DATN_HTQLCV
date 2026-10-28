namespace Analytics.Api.Models.Dtos;

public record WorkloadItemDto
{
    public string UserId { get; init; } = null!;
    public int OpenTaskCount { get; init; }
    public int PendingReviewCount { get; init; }
    public int OriginalEstimateMinutes { get; init; }
    public int CurrentEstimateMinutes { get; init; }
    public int? RemainingMinutes { get; init; }
    public int? CapacityMinutes { get; init; }
    public decimal? UtilizationRate { get; init; }
    public QualityDto Quality { get; init; } = new();
}
