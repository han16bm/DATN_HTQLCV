using Shared.Commons.Models;

namespace Identity.Api.Models.Queries;

public record IpAccessLogQuery : PagingQuery
{
    public string? Status { get; init; }
    public string? Scope { get; init; }
    public string? Q { get; init; }
}
