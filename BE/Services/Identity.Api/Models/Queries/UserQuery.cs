using Shared.Commons.Models;

namespace Identity.Api.Models.Queries;

public record UserQuery : PagingQuery
{
    public string? Q { get; init; }
    public string? UnitId { get; init; }
    public string? SystemRole { get; init; }
    public string? Status { get; init; }
}
