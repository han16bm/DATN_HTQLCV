namespace Analytics.Api.Models.Dtos;

public record QualityDto
{
    public string Status { get; init; } = "SUFFICIENT"; // SUFFICIENT | PARTIAL | INSUFFICIENT
    public List<string> MissingFields { get; init; } = [];
    public bool ScopeLimited { get; init; }
}
