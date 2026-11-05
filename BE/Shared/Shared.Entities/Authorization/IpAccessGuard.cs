using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Shared.Commons.Exceptions;
using Shared.Commons.Models;
using Shared.Configuration;

namespace Shared.Entities.Authorization;

/// <summary>
/// Quyết định IP duy nhất cho [AdminArea], bộ lọc toàn hệ thống (phạm vi SYSTEM) và đăng nhập.
/// IP không khớp entry Active nào luôn được ghi IpAccessLogs, kể cả khi whitelist đang tắt (§10.2).
/// IP lấy từ Connection.RemoteIpAddress — service phải gọi UseForwardedHeaders (proxy loopback), không tự đọc X-Forwarded-For.
/// </summary>
public class IpAccessGuard(ApplicationDbContext db, IConfiguration configuration, IpAccessRecorder recorder)
{
    /// <summary>Phạm vi lấy từ cấu hình tập trung (reload ≤30s); biến môi trường Security__AdminIpWhitelistEnabled=false để cứu hộ.</summary>
    public bool IsSystemScope()
    {
        return string.Equals(configuration[ConfigCatalog.IpWhitelistScope], ConfigCatalog.IpScopeSystem, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Trả lỗi 403 IP_NOT_ALLOWED khi phải chặn, null khi cho qua. scope là phạm vi của điểm kiểm tra (ADMIN | SYSTEM).</summary>
    public async Task<ForbiddenException?> CheckAsync(HttpContext http, string scope, string? username = null)
    {
        var ip = IpRules.Normalize(http.Connection.RemoteIpAddress);
        var cidrs = await db.IpWhitelistEntries.AsNoTracking().Where(e => e.IsActive).Select(e => e.Cidr).ToListAsync();
        if (IpRules.AnyMatches(cidrs, ip))
            return null;

        var enabled = configuration.GetValue(ConfigCatalog.AdminIpWhitelistEnabled, false);
        // Điểm kiểm tra SYSTEM (đăng nhập, API thường) chỉ chặn khi phạm vi cấu hình là SYSTEM; điểm ADMIN chặn ở cả hai phạm vi
        var blocked = enabled && (scope == ConfigCatalog.IpScopeAdmin || IsSystemScope());
        var ipText = ip?.ToString() ?? string.Empty;
        if (ip is not null)
            recorder.Record(ipText, scope, blocked, http.User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                username ?? http.User.Identity?.Name, http.Request.Path.Value ?? "/");
        if (!blocked)
            return null;

        var message = scope == ConfigCatalog.IpScopeSystem
            ? $"Bạn không có quyền truy cập hệ thống từ địa chỉ IP {ipText}. Vui lòng liên hệ quản trị viên để được cấp quyền truy cập."
            : $"Địa chỉ IP {ipText} không được phép truy cập khu quản trị. Vui lòng liên hệ quản trị viên.";
        return new ForbiddenException(message) { Code = "IP_NOT_ALLOWED", Details = new { ip = ipText, scope } };
    }

    public static ObjectResult ToResult(AppException denied)
    {
        return new ObjectResult(new ErrorResponse(denied.Code ?? "FORBIDDEN", denied.Message, Details: denied.Details))
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
    }
}
