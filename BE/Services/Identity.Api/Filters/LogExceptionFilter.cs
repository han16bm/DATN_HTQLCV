using Microsoft.AspNetCore.Mvc.Filters;

namespace Identity.Api.Filters;

/// <summary>Ghi log exception trước khi AuditAttribute (Order=int.MinValue) chuẩn hoá response.</summary>
public class LogExceptionFilter(ILogger<LogExceptionFilter> logger) : IAsyncActionFilter, IOrderedFilter
{
    public int Order => int.MinValue + 1;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        if (executed.Exception is not null && !executed.ExceptionHandled)
            logger.LogError(executed.Exception, "Unhandled exception at {Path}", context.HttpContext.Request.Path);
    }
}
