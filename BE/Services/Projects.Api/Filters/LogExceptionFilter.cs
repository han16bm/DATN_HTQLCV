using Microsoft.AspNetCore.Mvc.Filters;
using Shared.Commons.Exceptions;

namespace Projects.Api.Filters;

/// <summary>Log exception hệ thống (không phải lỗi nghiệp vụ) trước khi AuditAttribute chuẩn hoá response.</summary>
public class LogExceptionFilter(ILogger<LogExceptionFilter> logger) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        if (executed.Exception is not null and not AppException)
            logger.LogError(executed.Exception, "Unhandled exception at {Path}", context.HttpContext.Request.Path);
    }
}
