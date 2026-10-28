using Shared.Commons.Models;

namespace Identity.Api.Models.Queries;

public record TeamQuery : PagingQuery
{
    public string? Q { get; init; }
    public string? UnitId { get; init; }
}
