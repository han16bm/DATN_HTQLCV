using Shared.Commons.Models;
using Shared.Entities.Enums;

namespace Projects.Api.Models.Queries;

public record ProjectQuery : PagingQuery
{
    public string? Q { get; init; }
    public string? UnitId { get; init; }
    public ProjectStatus? Status { get; init; }
}

public record MembershipQuery : PagingQuery
{
    public string? Q { get; init; }
}
