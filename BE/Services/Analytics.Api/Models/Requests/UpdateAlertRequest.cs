using Shared.Entities.Enums;

namespace Analytics.Api.Models.Requests;

public record UpdateAlertRequest
{
    public AlertStatus Status { get; set; }
    public string? ResolutionNote { get; set; }
}
