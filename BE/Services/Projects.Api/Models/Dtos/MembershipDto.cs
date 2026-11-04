namespace Projects.Api.Models.Dtos;

public record MembershipDto(
    string Id,
    int Version,
    string UserId,
    string ProjectRole,
    DateTime? EndedAt,
    PersonRefDto User,
    DateTime CreatedAt,
    RefDto? CreatedBy,
    DateTime UpdatedAt,
    RefDto? UpdatedBy);
