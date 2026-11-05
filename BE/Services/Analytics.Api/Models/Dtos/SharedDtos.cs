namespace Analytics.Api.Models.Dtos;

public record PersonRefDto(string Id, string DisplayName);

public record EntityLabelDto(string Id, string Name);

public record AnalysisRefDto(string AnalysisId);
