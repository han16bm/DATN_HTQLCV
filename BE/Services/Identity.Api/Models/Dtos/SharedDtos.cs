namespace Identity.Api.Models.Dtos;

public record PersonRefDto(string Id, string DisplayName);
public record EntityLabelDto(string Id, string Name);
public record RefDto(string Id, string Label);
// Tư cách của một người trong từng dự án, kèm quyền hiệu lực lúc này (ADMIN_MODULES §11.7).
public record UserProjectDto(string MembershipId, EntityLabelDto Project, int ProjectVersion, string ProjectStatus, string ProjectRole,
    bool IsOwner, IReadOnlyList<string> Permissions, DateTime StartedAt, DateTime? EndedAt);
