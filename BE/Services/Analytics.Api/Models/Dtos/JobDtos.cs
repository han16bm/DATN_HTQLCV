namespace Analytics.Api.Models.Dtos;

public record RefDto(string Id, string Label);

public record BackgroundJobDto(
    string Code,
    int Version,
    string Name,
    string? Description,
    bool IsEnabled,
    int IntervalMinutes,
    DateTime? LastRunAt,
    DateTime? NextRunAt,
    string? LastStatus,
    DateTime UpdatedAt,
    RefDto? UpdatedBy);

public record JobRunDto(
    string Id,
    string JobCode,
    DateTime StartedAt,
    DateTime? FinishedAt,
    long? DurationMs,
    string Status,
    string Trigger,
    RefDto? TriggeredBy,
    Dictionary<string, int>? Summary,
    string? Error);
