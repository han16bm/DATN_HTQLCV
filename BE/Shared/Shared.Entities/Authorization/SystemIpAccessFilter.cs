using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Shared.Configuration;

namespace Shared.Entities.Authorization;

/// <summary>
/// Bộ lọc toàn cục (đăng ký ở AddEntityServices cho cả 4 service): khi Security:IpWhitelistScope = SYSTEM, mọi API kể cả ẩn danh
/// phải qua IpAccessGuard. Là filter MVC nên chạy sau AuthorizationMiddleware: request thiếu/hết hạn token vẫn nhận 401 trước.
/// Bỏ qua API [AdminArea] (đã kiểm tra với phạm vi ADMIN) và action có [IpCheckedInAction] (tự kiểm tra, ví dụ đăng nhập).
/// </summary>
public class SystemIpAccessFilter : IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var metadata = context.ActionDescriptor.EndpointMetadata;
        if (metadata.Any(m => m is AdminAreaAttribute or IpCheckedInActionAttribute))
            return;

        var guard = context.HttpContext.RequestServices.GetRequiredService<IpAccessGuard>();
        if (!guard.IsSystemScope())
            return;

        var denied = await guard.CheckAsync(context.HttpContext, ConfigCatalog.IpScopeSystem);
        if (denied is not null)
            context.Result = IpAccessGuard.ToResult(denied);
    }
}

/// <summary>Action tự gọi IpAccessGuard (để ghi thêm dữ liệu như username đã thử) — SystemIpAccessFilter bỏ qua để không đếm hai lần.</summary>
[AttributeUsage(AttributeTargets.Method)]
public class IpCheckedInActionAttribute : Attribute
{
}
