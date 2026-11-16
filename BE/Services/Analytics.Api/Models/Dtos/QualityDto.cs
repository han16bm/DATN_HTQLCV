namespace Analytics.Api.Models.Dtos;

public record QualityDto(string Status) // SUFFICIENT | PARTIAL | INSUFFICIENT
{
    /// <summary>Tên nguồn/chỉ số còn thiếu dữ liệu; không tự thay bằng 0.</summary>
    public List<string> MissingFields { get; init; } = [];
}

public record AnalysisMetaDto(DateTime DataAsOf, QualityDto Quality);
