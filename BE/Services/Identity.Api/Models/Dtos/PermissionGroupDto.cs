namespace Identity.Api.Models.Dtos;

public record PermissionGroupDto(
    string Id,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Code,
    string Name,
    string? Description,
    List<string> Features,
    List<string> MemberIds,
    List<RefDto> Members,
    string Status,
    bool IsSystem,
    RefDto? CreatedBy,
    RefDto? UpdatedBy);

public record FeatureDto(
    string Code,
    int Version,
    string Name,
    string? Description,
    string? ParentCode,
    bool IsGroup,
    string? Scope,
    string? Path,
    string? Icon,
    int SortOrder,
    bool IsActive,
    DateTime UpdatedAt,
    RefDto? UpdatedBy);
