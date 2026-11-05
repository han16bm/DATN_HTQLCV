namespace Analytics.Api.Models.Dtos;

public record QualityDto(string Status); // SUFFICIENT | PARTIAL | INSUFFICIENT

public record AnalysisMetaDto(DateTime DataAsOf, QualityDto Quality);
