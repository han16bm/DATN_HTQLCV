using Shared.Commons.Models;

namespace Analytics.Api.Models.Queries;

public record JobRunQuery : PagingQuery
{
    public string? Status { get; init; }
}
