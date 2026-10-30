namespace Analytics.Api.Models.Dtos;

public record DashboardDto(
    AnalysisMetaDto Metadata,
    int TotalTasks,
    List<StatusCountDto> ByStatus,
    List<MetricDto> Metrics,
    TimeVarianceDto TimeVariance,
    SubmissionTimelinessDto SubmissionTimeliness,
    ReportingDto Reporting,
    List<TrendPointDto> Trend,
    List<ProjectComparisonDto> ProjectComparisons,
    AnalysisRefDto OverviewRef);

public record StatusCountDto(string Status, int Count);

public record MetricDto(
    string Code,
    string Label,
    decimal? Value,
    string Unit, // TASK | COUNT | PERCENT | MINUTE | HOUR | REPORT
    string Basis, // CURRENT | PERIOD
    decimal? Denominator,
    AnalysisRefDto AnalysisRef);

public record TimeVarianceDto(
    int ActualMinutes,
    int CurrentEstimateMinutes,
    int OriginalEstimateMinutes,
    int DeltaCurrentMinutes,
    int DeltaOriginalMinutes);

public record SubmissionTimelinessDto(int OnTimeCount, int LateCount, int Denominator);

public record ReportingDto(int SubmittedDaily, int SubmittedWeekly);

public record TrendPointDto(DateOnly Date, int? CompletedCount, int? SubmissionCount);

public record ProjectComparisonDto(
    string ProjectId,
    int ValidTaskCount,
    decimal? CompletionRate,
    int OverdueCount,
    AnalysisRefDto AnalysisRef,
    string ProjectName,
    int ActualMinutes);
