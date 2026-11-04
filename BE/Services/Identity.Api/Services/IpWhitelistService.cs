using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Utils;
using Shared.Configuration;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

public class IpWhitelistService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<IpWhitelistEntry>(context, httpContextAccessor), IIpWhitelistService
{
    public async Task<IpWhitelistDto> GetAsync()
    {
        var entries = await context.IpWhitelistEntries.AsNoTracking().OrderBy(e => e.CreatedAt).ToListAsync();
        var names = await LoadDisplayNamesAsync(entries.SelectMany(e => new[] { e.CreatedBy, e.UpdatedBy }));
        var currentIp = IpRules.Normalize(httpContextAccessor.HttpContext?.Connection.RemoteIpAddress)?.ToString() ?? string.Empty;
        var toggle = await FindToggleAsync();
        var scope = await FindGlobalConfigAsync(ConfigCatalog.IpWhitelistScope);
        var pendingCount = await context.IpAccessLogs.CountAsync(l => l.Status == IpAccessLog.StatusPending);
        return new IpWhitelistDto(
            IsOn(toggle), toggle.Id, toggle.Version,
            scope.IsActive ? scope.Value : ConfigCatalog.IpScopeAdmin, scope.Id, scope.Version, pendingCount,
            currentIp, entries.Select(e => ToDto(e, names)).ToList());
    }

    public async Task<IpWhitelistEntryDto> CreateAsync(IpWhitelistEntryCreateRequest request)
    {
        var entry = new IpWhitelistEntry
        {
            Id = GuidGenerator.NewId(),
            Cidr = ParseCidr(request.Cidr),
            Description = request.Description?.Trim(),
            IsActive = true,
            CreatedBy = CurrentUserId(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1
        };

        await context.IpWhitelistEntries.AddAsync(entry);
        await WriteAuditLog(entry.Id, "CREATE", null, new { entry.Cidr, entry.Description });
        await context.SaveChangesAsync();
        return ToDto(entry, await LoadDisplayNamesAsync([entry.CreatedBy, entry.UpdatedBy]));
    }

    public async Task<IpWhitelistEntryDto> UpdateAsync(string id, IpWhitelistEntryPatchRequest request, int ifMatchVersion)
    {
        var entry = await FindAsync(id);
        CheckVersion(entry.Version, ifMatchVersion);

        var before = new { entry.Cidr, entry.Description, entry.IsActive };
        if (request.Cidr is not null) entry.Cidr = ParseCidr(request.Cidr);
        if (request.Description is not null) entry.Description = request.Description.Trim();
        if (request.IsActive.HasValue) entry.IsActive = request.IsActive.Value;
        await EnsureStillAllowedAsync(entry.Id, entry.IsActive ? entry.Cidr : null);

        entry.UpdatedAt = DateTime.UtcNow;
        entry.Version++;

        await WriteAuditLog(entry.Id, "UPDATE", before, new { entry.Cidr, entry.Description, entry.IsActive }, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(entry, await LoadDisplayNamesAsync([entry.CreatedBy, entry.UpdatedBy]));
    }

    public async Task DeleteAsync(string id, int ifMatchVersion)
    {
        var entry = await FindAsync(id);
        CheckVersion(entry.Version, ifMatchVersion);
        await EnsureStillAllowedAsync(entry.Id, null);

        context.IpWhitelistEntries.Remove(entry);
        await WriteAuditLog(entry.Id, "DELETE", new { entry.Cidr, entry.Description, entry.IsActive }, null);
        await context.SaveChangesAsync();
    }

    /// <summary>Khi whitelist đang bật, trạng thái sau thay đổi (entry này thay bằng replacementCidr) phải còn cho IP hiện tại qua.</summary>
    private async Task EnsureStillAllowedAsync(string changedId, string? replacementCidr)
    {
        if (!await IsEnabledAsync())
            return;

        var cidrs = await context.IpWhitelistEntries.AsNoTracking()
            .Where(e => e.IsActive && e.Id != changedId)
            .Select(e => e.Cidr)
            .ToListAsync();
        if (replacementCidr is not null)
            cidrs.Add(replacementCidr);
        SystemConfigService.EnsureNotSelfLockout(cidrs, httpContextAccessor.HttpContext);
    }

    // Đọc thẳng DB thay vì IConfiguration (reload theo chu kỳ) — kiểm tra chống tự khoá phải theo giá trị mới nhất
    private async Task<bool> IsEnabledAsync()
    {
        return IsOn(await FindToggleAsync());
    }

    private async Task<SystemConfig> FindToggleAsync()
    {
        return await FindGlobalConfigAsync(ConfigCatalog.AdminIpWhitelistEnabled);
    }

    private async Task<SystemConfig> FindGlobalConfigAsync(string key)
    {
        return await context.SystemConfigs.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key && c.ServiceType == ConfigCatalog.Global)
            ?? throw new NotFoundException($"Thiếu cấu hình {key} (Global) — chạy lại migration seed.");
    }

    private static bool IsOn(SystemConfig toggle)
    {
        return toggle.IsActive && bool.TryParse(toggle.Value, out var enabled) && enabled;
    }

    private static string ParseCidr(string raw)
    {
        return IpRules.TryNormalizeCidr(raw)
            ?? throw new ValidationException("Địa chỉ IP/CIDR không hợp lệ (ví dụ 203.113.1.5, 10.0.0.0/24, ::1/128).", ["cidr"]);
    }

    private async Task<IpWhitelistEntry> FindAsync(string id)
    {
        return await context.IpWhitelistEntries.FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new NotFoundException("Không tìm thấy entry IP whitelist.");
    }

    private static IpWhitelistEntryDto ToDto(IpWhitelistEntry e, Dictionary<string, string> names)
    {
        return new IpWhitelistEntryDto(e.Id, e.Version, e.Cidr, e.Description, e.IsActive, e.CreatedAt, e.UpdatedAt, PersonRef(e.CreatedBy, names), PersonRef(e.UpdatedBy, names));
    }
}
