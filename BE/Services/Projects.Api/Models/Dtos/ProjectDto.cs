namespace Projects.Api.Models.Dtos;

public record ProjectDto(
    string Id,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Code,
    string Name,
    string Objective,
    string UnitId,
    string OwnerId,
    DateOnly StartDate,
    DateTime DueAt,
    string Status,
    DateTime? CompletedAt,
    DateTime? CancelledAt,
    PersonRefDto Owner,
    EntityLabelDto Unit,
    RefDto? CreatedBy,
    RefDto? UpdatedBy);

public record ClosureChecksDto(int OpenTaskCount, int PendingReviewCount, int PendingReportCount, bool CanClose);
