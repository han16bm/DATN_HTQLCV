using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Shared.Commons.Models;

namespace Shared.Entities.Authorization;

/// <summary>Chặn 403 nếu user không có ít nhất một trong các mã quyền hiệu lực (tính lại theo DB mỗi request).</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class RequiresPermissionAttribute(params string[] features) : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var db = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
        var user = userId is null ? null : await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        var effective = user is null ? [] : await PermissionEvaluator.GetEffectivePermissionsAsync(db, user);
        if (!features.Any(effective.Contains))
        {
            // Nêu tên tiếng Việt của quyền cần có (§10.3); mã chưa có trong danh mục thì hiện nguyên mã
            var names = await db.Features.AsNoTracking().Where(f => features.Contains(f.Code)).ToDictionaryAsync(f => f.Code, f => f.Name);
            var label = string.Join(" hoặc ", features.Select(f => names.GetValueOrDefault(f, f)));
            context.Result = new ObjectResult(new ErrorResponse(
                "FORBIDDEN",
                $"Bạn không có quyền sử dụng chức năng này (cần quyền: {label}). Vui lòng liên hệ quản trị viên.",
                Details: new { required = features }))
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        await next();
    }
}
