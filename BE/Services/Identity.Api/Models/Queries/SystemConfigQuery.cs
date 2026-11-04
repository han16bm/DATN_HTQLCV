namespace Identity.Api.Models.Queries;

/// <summary>Bộ lọc danh sách cấu hình tập trung — số dòng nhỏ nên không phân trang.</summary>
public record SystemConfigQuery
{
    public string? ServiceType { get; init; }
    public string? Group { get; init; }
    public string? Q { get; init; }
}
