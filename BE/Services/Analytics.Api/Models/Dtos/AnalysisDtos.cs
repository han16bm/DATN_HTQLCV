using System.ComponentModel.DataAnnotations;

namespace Analytics.Api.Models.Dtos;

// Hợp đồng /analytics/summary, /analytics/details/{id}, /analytics/jobs (FE analytics/schemas/analysis-*.schema.ts).

public record MeasureDto(string Id, string Label, decimal? Value, string Unit, string Formula); // TASK|COUNT|PERCENT|MINUTE|HOUR

public record ContextItemDto(string Key, string Label, string? Value, string ValueType); // TEXT|UTC|DATE

public record SeriesPointDto(DateOnly Date, decimal? Value);

public record SeriesDto(string Id, string Label, List<SeriesPointDto> Points);

/// <summary>Target: TASK_DETAIL | TASK_PLAN | TASK_ASSIGNMENT | SUBMISSION_REVIEW | REVIEW_QUEUE | REPORT_DETAIL.</summary>
public record DomainActionDto(string Target, string? TaskId, string? SubmissionId, string? ReportId);

public record EvidenceDto(string Id, string Label, DateTime? ObservedAt, DomainActionDto? Action);

public record AnalysisScopeDto(DateOnly From, DateOnly To);

/// <summary>Đối tượng phân tích, đúng một khoá theo Kind (analysisSubjectSchema).</summary>
public record AnalysisSubjectDto(
    string Kind,
    [property: System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)] string? TaskId = null,
    [property: System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)] string? UserId = null,
    [property: System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)] string? ProjectId = null,
    [property: System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)] string? Stage = null,
    [property: System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)] string? MetricCode = null,
    [property: System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)] string? UnitId = null)
{
    [System.Text.Json.Serialization.JsonIgnore]
    public string Key => TaskId ?? UserId ?? MetricCode ?? UnitId ?? (Stage is null ? ProjectId : $"{ProjectId}:{Stage}") ?? "-";
    public static AnalysisSubjectDto Task(string id) => new("TASK", TaskId: id);
    public static AnalysisSubjectDto Person(string id) => new("PERSON", UserId: id);
    public static AnalysisSubjectDto Project(string id) => new("PROJECT", ProjectId: id);
    public static AnalysisSubjectDto Metric(string code) => new("METRIC", MetricCode: code);
    public static AnalysisSubjectDto Unit(string id) => new("UNIT", UnitId: id);
}

public record AnalysisSnapshotDto(
    string Id,
    string AnalysisId,
    string AnalysisType,
    string Title,
    AnalysisSubjectDto Subject,
    AnalysisScopeDto Scope,
    DateTime DataAsOf,
    QualityDto Quality,
    List<MeasureDto> Metrics,
    List<ContextItemDto> Context,
    List<SeriesDto> Series,
    List<EvidenceDto> Evidence);

public record JobErrorDto(string Message, bool Retryable, int? RetryAfterSeconds);

public record FindingDto(string Id, string Title, string Text, List<string> MetricIds, List<string> EvidenceIds);

public record RecommendationDto(string Id, string Title, string Text, List<string> EvidenceIds, DomainActionDto? Action);

public record ExplanationDto(
    string AnalysisId,
    string SnapshotId,
    DateTime GeneratedAt,
    string ModelDisplayName,
    string Summary,
    List<FindingDto> Findings,
    List<RecommendationDto> Recommendations,
    List<string> Limitations,
    string PromptVersion = "template-v1");

/// <summary>Status: NOT_REQUESTED | QUEUED | RUNNING | READY | FAILED | UNAVAILABLE.</summary>
public record ExplanationStateDto(string Status, ExplanationDto? LastSuccess, string? ActiveJobId, JobErrorDto? Error);

public record FreshnessDto(string Status, string? LatestAnalysisId); // CURRENT | OUTDATED

public record GenerationPolicyDto(bool Allowed);

public record FeedbackDto(string Verdict, string Comment, PersonRefDto Actor, DateTime CreatedAt);

public record FeedbackStateDto(FeedbackDto? Latest, bool CanSubmit);

public record AnalysisDetailDto(
    AnalysisSnapshotDto Snapshot,
    FreshnessDto Freshness,
    ExplanationStateDto Explanation,
    GenerationPolicyDto Generation,
    string SystemSummary,
    FeedbackStateDto Feedback);

public record AnalysisJobDto(string Id, string AnalysisId, string Status, DateTime CreatedAt, DateTime? CompletedAt, int PollAfterMs, JobErrorDto? Error);

public record SummaryMetricDto(string Label, decimal? Value, string Unit, string Formula);

public record HighlightDto(string Title, string Description, string Severity, AnalysisRefDto AnalysisRef); // INFO|MEDIUM|HIGH

public record AnalysisSummaryDto(
    AnalysisMetaDto Metadata,
    AnalysisRefDto OverviewRef,
    List<SummaryMetricDto> Metrics,
    List<HighlightDto> Highlights,
    string SummaryText);

public record CreateAnalysisJobRequest
{
    [Required(ErrorMessage = "Vui lòng cung cấp thông tin bắt buộc."), MaxLength(100)]
    public string AnalysisId { get; init; } = null!;

    [RegularExpression("^(REUSE_OR_CREATE|REGENERATE)$", ErrorMessage = "Chế độ tạo diễn giải không hợp lệ.")]
    public string? GenerationMode { get; init; }

    [RegularExpression("^vi-VN$", ErrorMessage = "Ngôn ngữ chưa được hỗ trợ.")]
    public string? Locale { get; init; }
}

public record CreateAnalysisFeedbackRequest
{
    [Required(ErrorMessage = "Vui lòng chọn đánh giá."), RegularExpression("^(CONFIRMED|REJECTED)$", ErrorMessage = "Đánh giá không hợp lệ.")]
    public string Verdict { get; init; } = null!;

    [Required(ErrorMessage = "Vui lòng nhập thông tin bắt buộc"), MaxLength(2000)]
    public string Comment { get; init; } = null!;
}
