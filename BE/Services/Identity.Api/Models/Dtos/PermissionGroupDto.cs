namespace Identity.Api.Models.Dtos;

public record PermissionGroupDto(
    string Id,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Name,
    string? Description,
    List<string> Features,
    List<string> MemberIds,
    string Status);
