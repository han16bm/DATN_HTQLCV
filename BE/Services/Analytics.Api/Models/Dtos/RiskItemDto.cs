namespace Analytics.Api.Models.Dtos;

public record RiskItemDto(
    string TaskId,
    string TaskTitle,
    PersonRefDto? Assignee,
    string Category, // AT_RISK | OVERDUE | INSUFFICIENT_DATA | NO_SIGNAL
    List<string> Evidence,
    QualityDto Quality,
    AnalysisRefDto AnalysisRef);

public record ProjectRiskSummaryDto(
    string ProjectName,
    string RiskLevel, // LOW | MEDIUM | HIGH | UNKNOWN
    int OverdueCount,
    int AtRiskCount,
    int InsufficientDataCount,
    List<string> Evidence,
    AnalysisRefDto AnalysisRef);

public record RisksDto(AnalysisMetaDto Metadata, List<RiskItemDto> Items, List<ProjectRiskSummaryDto> Projects);
