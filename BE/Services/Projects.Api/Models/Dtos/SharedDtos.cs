namespace Projects.Api.Models.Dtos;

public record PersonRefDto(string Id, string DisplayName);

public record EntityLabelDto(string Id, string Name);

public record AuditDto(
    string Id,
    string EntityType,
    string EntityId,
    string ActorId,
    string Action,
    DateTime At,
    object? Before,
    object? After,
    string? Reason);
