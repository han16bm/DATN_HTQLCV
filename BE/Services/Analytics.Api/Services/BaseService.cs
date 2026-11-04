using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Analytics.Api.Services;

public abstract class BaseService<T>(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
{
    protected readonly ApplicationDbContext Context = context;
    protected readonly IHttpContextAccessor HttpContextAccessor = httpContextAccessor;

    protected string CurrentUserId => HttpContextAccessor.HttpContext?.GetUserId() ?? "UNKNOWN";

    protected async Task WriteAuditLogAsync(string entityId, string action, object? before, object? after, string? reason = null)
    {
        Context.AuditLogs.Add(new AuditLog
        {
            Id = GuidGenerator.NewId(),
            EntityType = typeof(T).Name,
            EntityId = entityId,
            ActorId = CurrentUserId,
            Action = action,
            At = DateTime.UtcNow,
            BeforeJson = before is null ? null : JsonSerializer.Serialize(before),
            AfterJson = after is null ? null : JsonSerializer.Serialize(after),
            Reason = reason
        });
        await Task.CompletedTask;
    }

    /// <summary>If-Match bắt buộc với API có version; thiếu header -> 428, khác version hiện tại -> 412.</summary>
    protected void CheckIfMatch(int currentVersion)
    {
        var header = HttpContextAccessor.HttpContext?.Request.Headers.IfMatch.ToString();
        if (string.IsNullOrWhiteSpace(header))
            throw new PreconditionRequiredException("Thiếu header If-Match.");

        if (!int.TryParse(header.Trim('"'), out var requestedVersion) || requestedVersion != currentVersion)
            throw new PreconditionFailedException("Dữ liệu vừa được thay đổi, vui lòng tải lại.");
    }
}
