using System.Text.Json;
using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

public class AuditLogService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<AuditLog>(context, httpContextAccessor), IAuditLogService
{
    public async Task<PagedResult<AuditLogRowDto>> ListAsync(AuditLogQuery query)
    {
        var q = context.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Q))
            q = q.Where(a => a.EntityId.Contains(query.Q) || a.Action.Contains(query.Q) || (a.Reason != null && a.Reason.Contains(query.Q)));
        if (!string.IsNullOrWhiteSpace(query.EntityType)) q = q.Where(a => a.EntityType == query.EntityType);
        if (!string.IsNullOrWhiteSpace(query.ActorId)) q = q.Where(a => a.ActorId == query.ActorId);
        if (!string.IsNullOrWhiteSpace(query.Action)) q = q.Where(a => a.Action == query.Action);
        if (query.From.HasValue)
        {
            var from = query.From.Value.UtcDateTime;
            q = q.Where(a => a.At >= from);
        }
        if (query.To.HasValue)
        {
            var to = query.To.Value.UtcDateTime;
            q = q.Where(a => a.At <= to);
        }

        var paged = await q.OrderByDescending(a => a.At).ThenByDescending(a => a.Id).ToPagedResultAsync(query);
        var names = await LoadDisplayNamesAsync(paged.Items.Select(a => a.ActorId));
        return new PagedResult<AuditLogRowDto>
        {
            Items = paged.Items.Select(a => new AuditLogRowDto(a.Id, a.At, a.EntityType, a.EntityId, a.Action, PersonRef(a.ActorId, names)!, a.Reason)).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            Total = paged.Total
        };
    }

    public async Task<AuditLogDto> GetAsync(string id)
    {
        var a = await context.AuditLogs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("Không tìm thấy nhật ký.");
        var names = await LoadDisplayNamesAsync([a.ActorId]);
        return new AuditLogDto(a.Id, a.At, a.EntityType, a.EntityId, a.Action, PersonRef(a.ActorId, names)!, a.Reason,
            Parse(a.BeforeJson), Parse(a.AfterJson));
    }

    public async Task<List<string>> ListEntityTypesAsync()
    {
        return await context.AuditLogs.AsNoTracking().Select(a => a.EntityType).Distinct().OrderBy(t => t).ToListAsync();
    }

    private static JsonElement? Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.Clone();
        }
        catch (JsonException)
        {
            // Dữ liệu cũ không phải JSON hợp lệ vẫn trả về dạng chuỗi để không mất thông tin
            return JsonSerializer.SerializeToElement(json);
        }
    }
}
