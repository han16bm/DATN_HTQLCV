namespace Identity.Api.Models.Dtos;

public record UserDto(
    string Id,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Username,
    string DisplayName,
    string Email,
    string UnitId,
    string SystemRole,
    string Status,
    EntityLabelDto Unit);
