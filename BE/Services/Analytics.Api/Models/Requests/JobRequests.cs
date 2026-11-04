using System.ComponentModel.DataAnnotations;

namespace Analytics.Api.Models.Requests;

public record BackgroundJobPatchRequest
{
    public bool? IsEnabled { get; init; }
    [Range(1, 1440)]
    public int? IntervalMinutes { get; init; }
    [MaxLength(2000)]
    public string? Reason { get; init; }
}
