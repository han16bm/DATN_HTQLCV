namespace Identity.Api.Models.Dtos;

public record ProjectAccessDto(string ProjectId, string ProjectRole);
public record SessionDto(UserDto User, List<ProjectAccessDto> ProjectAccess, List<string> Permissions);
public record LoginResponseDto(SessionDto Session, string AccessToken, DateTime ExpiresAt);
