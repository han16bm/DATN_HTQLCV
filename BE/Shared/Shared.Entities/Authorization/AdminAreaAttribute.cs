using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Shared.Configuration;

namespace Shared.Entities.Authorization;

/// <summary>
/// Đánh dấu API khu quản trị: khi bật Security:AdminIpWhitelistEnabled, IP client phải khớp một entry Active (ở cả hai phạm vi).
/// Quyết định và ghi nhật ký IP nằm ở IpAccessGuard (Scope ADMIN).
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AdminAreaAttribute : Attribute, IAsyncActionFilter, IOrderedFilter
{
    // Chạy trước RequiresPermission (Order 0) để IP bị chặn luôn nhận IP_NOT_ALLOWED
    public int Order => -1000;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var guard = context.HttpContext.RequestServices.GetRequiredService<IpAccessGuard>();
        var denied = await guard.CheckAsync(context.HttpContext, ConfigCatalog.IpScopeAdmin);
        if (denied is not null)
        {
            context.Result = IpAccessGuard.ToResult(denied);
            return;
        }

        await next();
    }
}
