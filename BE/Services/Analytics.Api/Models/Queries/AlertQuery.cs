using Shared.Commons.Models;
using Shared.Entities.Enums;

namespace Analytics.Api.Models.Queries;

public record AlertQuery : PagingQuery
{
    public string? Q { get; set; }
    public string? ProjectId { get; set; }
    public AlertStatus? Status { get; set; }
    public AlertSeverity? Severity { get; set; }
}
