namespace Analytics.Api.Models.Dtos;

public record WorkloadItemDto(
    string UserId,
    int OpenTaskCount,
    int PendingReviewCount,
    int OriginalEstimateMinutes,
    int CurrentEstimateMinutes,
    int? RemainingMinutes,
    int? CapacityMinutes,
    decimal? UtilizationRate,
    PersonRefDto Person,
    AnalysisRefDto AnalysisRef);

public record WorkloadDto(AnalysisMetaDto Metadata, List<WorkloadItemDto> Items);
