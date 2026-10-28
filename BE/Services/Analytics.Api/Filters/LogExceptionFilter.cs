using Microsoft.AspNetCore.Mvc.Filters;
using Shared.Commons.Extensions;

namespace Analytics.Api.Filters;

/// <summary>Order sau AuditAttribute (int.MinValue) — chỉ để log, AuditAttribute đã format response.</summary>
public class LogExceptionFilter(ILogger<LogExceptionFilter> logger) : IAsyncActionFilter, IOrderedFilter
{
    public int Order => int.MinValue + 1;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        if (executed.Exception is null || executed.ExceptionHandled) return;

        logger.LogError(executed.Exception, "Lỗi chưa xử lý tại {Path}, traceId={TraceId}",
            context.HttpContext.Request.Path, context.HttpContext.GetTraceId());
    }
}
