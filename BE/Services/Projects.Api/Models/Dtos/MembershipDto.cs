namespace Projects.Api.Models.Dtos;

public record MembershipDto(
    string Id,
    int Version,
    string UserId,
    string ProjectRole,
    DateTime? EndedAt,
    PersonRefDto User);
