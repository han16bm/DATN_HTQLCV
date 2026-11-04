namespace Identity.Api.Models.Dtos;

// Quyền hiệu lực trong từng dự án (ADMIN_MODULES §11.5), FE dùng để mở thao tác theo dự án.
public record ProjectAccessDto(string ProjectId, string ProjectRole, IReadOnlyList<string> Permissions);
public record SessionDto(UserDto User, List<ProjectAccessDto> ProjectAccess, List<string> Permissions);
public record LoginResponseDto(SessionDto Session, string AccessToken, DateTime ExpiresAt);
