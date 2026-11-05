using System.Net;
using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

/// <summary>Nhật ký IP chưa có rule (§10.2). Dòng được tạo/cộng dồn bởi IpAccessRecorder; ở đây chỉ đọc và xử lý (cho phép/bỏ qua).</summary>
public class IpAccessLogService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor, IIpWhitelistService whitelistService)
    : BaseService<IpAccessLog>(context, httpContextAccessor), IIpAccessLogService
{
    public async Task<PagedResult<IpAccessLogDto>> ListAsync(IpAccessLogQuery query)
    {
        var q = context.IpAccessLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var status = query.Status.Trim().ToUpperInvariant();
            q = q.Where(l => l.Status == status);
        }
        if (!string.IsNullOrWhiteSpace(query.Scope))
        {
            var scope = query.Scope.Trim().ToUpperInvariant();
            q = q.Where(l => l.Scope == scope);
        }
        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var term = query.Q.Trim();
            q = q.Where(l => l.Ip.Contains(term) || (l.LastUsername != null && l.LastUsername.Contains(term)));
        }

        var paged = await q.OrderByDescending(l => l.LastSeenAt).ThenBy(l => l.Id).ToPagedResultAsync(query);
        var names = await LoadDisplayNamesAsync(paged.Items.SelectMany(l => new[] { l.LastUserId, l.ResolvedBy }));
        return new PagedResult<IpAccessLogDto>
        {
            Items = paged.Items.Select(l => ToDto(l, names)).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            Total = paged.Total
        };
    }

    public async Task<IpAccessLogAllowResultDto> AllowAsync(string id, IpAccessLogAllowRequest request, int ifMatchVersion)
    {
        var log = await FindAsync(id);
        CheckVersion(log.Version, ifMatchVersion);
        if (log.Status == IpAccessLog.StatusAllowed)
            throw new BusinessRuleException("IP này đã được cho phép.");

        var cidr = IpRules.TryNormalizeCidr(string.IsNullOrWhiteSpace(request.Cidr) ? log.Ip : request.Cidr);
        if (cidr is null || !IPAddress.TryParse(log.Ip, out var ip) || !IpRules.Matches(cidr, ip))
            throw new ValidationException($"Địa chỉ IP/CIDR phải hợp lệ và bao gồm IP {log.Ip}.", ["cidr"]);

        var before = Snapshot(log);
        Resolve(log, IpAccessLog.StatusAllowed, request.Reason);
        await WriteAuditLog(log.Id, "ALLOW", before, Snapshot(log), request.Reason);

        var description = string.IsNullOrWhiteSpace(request.Description)
            ? "Cho phép từ nhật ký truy cập" + (log.LastUsername is null ? string.Empty : $" · {log.LastUsername}")
            : request.Description;
        // Cùng DbContext scoped: SaveChanges bên trong CreateAsync lưu entry mới, trạng thái log và cả hai audit log trong một transaction
        var entry = await whitelistService.CreateAsync(new IpWhitelistEntryCreateRequest { Cidr = cidr, Description = description });

        return new IpAccessLogAllowResultDto(ToDto(log, await LoadDisplayNamesAsync([log.LastUserId, log.ResolvedBy])), entry);
    }

    public async Task<IpAccessLogDto> DismissAsync(string id, IpAccessLogDismissRequest request, int ifMatchVersion)
    {
        var log = await FindAsync(id);
        CheckVersion(log.Version, ifMatchVersion);
        if (log.Status != IpAccessLog.StatusPending)
            throw new BusinessRuleException("Chỉ bỏ qua được IP đang chờ xử lý.");

        var before = Snapshot(log);
        Resolve(log, IpAccessLog.StatusDismissed, request.Reason);
        await WriteAuditLog(log.Id, "DISMISS", before, Snapshot(log), request.Reason);
        await context.SaveChangesAsync();

        return ToDto(log, await LoadDisplayNamesAsync([log.LastUserId, log.ResolvedBy]));
    }

    private void Resolve(IpAccessLog log, string status, string reason)
    {
        log.Status = status;
        log.ResolvedBy = CurrentUserId();
        log.ResolvedAt = DateTime.UtcNow;
        log.ResolveNote = reason.Trim();
        log.Version++;
    }

    private async Task<IpAccessLog> FindAsync(string id)
    {
        return await context.IpAccessLogs.FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new NotFoundException("Không tìm thấy nhật ký IP.");
    }

    private static object Snapshot(IpAccessLog l)
    {
        return new { l.Ip, l.Scope, l.Status, l.ResolveNote };
    }

    private static IpAccessLogDto ToDto(IpAccessLog l, Dictionary<string, string> names)
    {
        return new IpAccessLogDto(
            l.Id, l.Version, l.Ip, l.Scope, l.FirstSeenAt, l.LastSeenAt, l.HitCount, l.BlockedCount,
            PersonRef(l.LastUserId, names), l.LastUsername, l.LastPath, l.Status,
            PersonRef(l.ResolvedBy, names), l.ResolvedAt, l.ResolveNote);
    }
}
