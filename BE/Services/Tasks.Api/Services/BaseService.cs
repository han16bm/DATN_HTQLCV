using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Tasks.Api.Services;

public abstract class BaseService(ApplicationDbContext db)
{
    protected readonly ApplicationDbContext Db = db;

    protected void WriteAuditLog(string entityType, string entityId, string actorId, string action, object? before, object? after, string? reason = null)
    {
        Db.AuditLogs.Add(new AuditLog
        {
            Id = GuidGenerator.NewId(),
            EntityType = entityType,
            EntityId = entityId,
            ActorId = actorId,
            Action = action,
            At = DateTime.UtcNow,
            BeforeJson = before is null ? null : System.Text.Json.JsonSerializer.Serialize(before),
            AfterJson = after is null ? null : System.Text.Json.JsonSerializer.Serialize(after),
            Reason = reason
        });
    }
}
