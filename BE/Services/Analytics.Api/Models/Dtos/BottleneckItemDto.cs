namespace Analytics.Api.Models.Dtos;

public record BottleneckItemDto(
    string TaskId,
    string Stage, // TODO | IN_PROGRESS | PENDING_REVIEW
    double ElapsedMinutes,
    int RevisionCount,
    string CalendarBasis, // CONTINUOUS | WORKING_CALENDAR
    List<string> Evidence,
    string TaskTitle,
    PersonRefDto? Assignee,
    AnalysisRefDto AnalysisRef);

public record BottlenecksDto(AnalysisMetaDto Metadata, List<BottleneckItemDto> Items);
