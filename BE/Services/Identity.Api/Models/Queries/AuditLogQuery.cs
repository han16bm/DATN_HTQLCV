using Shared.Commons.Models;

namespace Identity.Api.Models.Queries;

public record AuditLogQuery : PagingQuery
{
    public string? Q { get; init; }
    public string? EntityType { get; init; }
    public string? ActorId { get; init; }
    public string? Action { get; init; }
    public DateTimeOffset? From { get; init; }
    public DateTimeOffset? To { get; init; }
}
