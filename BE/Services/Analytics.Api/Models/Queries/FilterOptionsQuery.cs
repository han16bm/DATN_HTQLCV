using Shared.Commons.Models;

namespace Analytics.Api.Models.Queries;

public record FilterOptionsQuery : PagingQuery
{
    public string Kind { get; set; } = null!; // UNIT | PROJECT | TEAM | PERSON
    public string? Q { get; set; }
    public string? UnitId { get; set; }
    public string? ProjectId { get; set; }
    public string? TeamId { get; set; }
}
