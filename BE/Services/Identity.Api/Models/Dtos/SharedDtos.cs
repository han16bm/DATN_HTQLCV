namespace Identity.Api.Models.Dtos;

public record PersonRefDto(string Id, string DisplayName);
public record EntityLabelDto(string Id, string Name);
public record RefDto(string Id, string Label);
