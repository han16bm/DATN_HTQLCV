namespace Identity.Api.Models.Dtos;

// Quyền hiệu lực trong từng dự án (ADMIN_MODULES §11.5), FE dùng để mở thao tác theo dự án.
public record ProjectAccessDto(string ProjectId, string ProjectRole, IReadOnlyList<string> Permissions);
public record SessionDto(UserDto User, List<ProjectAccessDto> ProjectAccess, List<string> Permissions);
public record LoginResponseDto(SessionDto Session, string AccessToken, DateTime ExpiresAt);

/// <summary>Đổi mật khẩu: phiên khác bị thu hồi, phiên hiện tại dùng token mới.</summary>
public record ChangePasswordResultDto(bool Ok, string AccessToken, DateTime ExpiresAt);
