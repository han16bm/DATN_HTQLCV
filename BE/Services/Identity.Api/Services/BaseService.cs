using Shared.Commons.Extensions;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

/// <summary>Ghi audit log trong cùng transaction với thay đổi dữ liệu — gọi trước SaveChanges, không sau.</summary>
public class BaseService<T>(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
{
    protected async Task WriteAuditLog(string entityId, string action, object? before, object? after, string? reason = null)
    {
        var actorId = httpContextAccessor.HttpContext?.GetUserId() ?? "SYSTEM";
        await context.AuditLogs.AddAsync(new AuditLog
        {
            Id = GuidGenerator.NewId(),
            EntityType = typeof(T).Name,
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
