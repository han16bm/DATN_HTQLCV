namespace Identity.Api.Models.Dtos;

public record TeamDto(
    string Id,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Name,
    string UnitId,
    List<string> MemberIds,
    string Status);
