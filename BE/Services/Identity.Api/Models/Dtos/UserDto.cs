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
    RefDto? UpdatedBy,
    string? Gender,
    DateOnly? BirthDate,
    string? Phone,
    string? PermanentAddress,
    string? TemporaryAddress,
    List<EntityLabelDto> Teams,
    List<EntityLabelDto> Projects);

/// <summary>GET /api/auth/me/profile: hồ sơ riêng của người đăng nhập (không có id/quyền/token).</summary>
public record PersonalProfileDto(
    int Version,
    DateTime CreatedAt,
    string Username,
    string DisplayName,
    string Email,
    bool IsSysAdmin,
    List<RefDto> Groups,
    string Unit,
    RefDto? CreatedBy,
    RefDto? UpdatedBy,
    string? Gender,
    DateOnly? BirthDate,
    string? Phone,
    string? PermanentAddress,
    string? TemporaryAddress,
    List<EntityLabelDto> Teams,
    List<EntityLabelDto> Projects);

/// <summary>Nhóm ACTIVE đang là thành viên và dự án PLANNED/ACTIVE còn tư cách thành viên.</summary>
public record UserAffiliations(List<EntityLabelDto> Teams, List<EntityLabelDto> Projects);

public record ProfileDto(string Id, string DisplayName, string? AvatarUrl, string Email, string Unit, List<string> Groups);

public record UserPermissionsDto(
    string UserId,
    int Version,
    bool IsSysAdmin,
    List<RefDto> Groups,
    List<string> GrantedFeatures,
    List<string> RevokedFeatures,
    List<string> Effective);
