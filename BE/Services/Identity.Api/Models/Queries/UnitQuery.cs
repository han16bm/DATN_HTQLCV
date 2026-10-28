using Shared.Commons.Models;

namespace Identity.Api.Models.Queries;

public record UnitQuery : PagingQuery
{
    public string? Q { get; init; }
    public string? Status { get; init; }
}
