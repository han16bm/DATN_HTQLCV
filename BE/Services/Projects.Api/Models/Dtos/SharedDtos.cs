namespace Projects.Api.Models.Dtos;

public record PersonRefDto(string Id, string DisplayName);

public record EntityLabelDto(string Id, string Name);

public record RefDto(string Id, string Label);

public record AuditDto(
    string Id,
    PersonRefDto Actor,
    string Action,
    DateTime At,
    object? Before,
    object? After,
    string? Reason);
