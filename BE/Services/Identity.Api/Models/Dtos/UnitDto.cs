namespace Identity.Api.Models.Dtos;

public record UnitDto(
    string Id,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Name,
    string? ParentId,
    string? ManagerId,
    string Status,
    RefDto? CreatedBy,
    RefDto? UpdatedBy);
