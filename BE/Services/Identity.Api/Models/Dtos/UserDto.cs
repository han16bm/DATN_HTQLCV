namespace Identity.Api.Models.Dtos;

public record UserDto(
    string Id,
    int Version,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Username,
    string DisplayName,
    string Email,
    string? AvatarUrl,
    string UnitId,
    bool IsSysAdmin,
    List<RefDto> Groups,
    string Status,
    EntityLabelDto Unit,
    RefDto? CreatedBy,
    RefDto? UpdatedBy);

public record ProfileDto(string Id, string DisplayName, string? AvatarUrl, string Email, string Unit, List<string> Groups);

public record UserPermissionsDto(
    string UserId,
    int Version,
    bool IsSysAdmin,
    List<RefDto> Groups,
    List<string> GrantedFeatures,
    List<string> RevokedFeatures,
    List<string> Effective);
