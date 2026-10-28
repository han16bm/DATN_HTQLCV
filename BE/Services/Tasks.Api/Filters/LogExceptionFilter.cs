using Microsoft.AspNetCore.Mvc.Filters;

namespace Tasks.Api.Filters;

/// <summary>Ghi log lỗi chưa xử lý ra console/Serilog; [Audit] đã lo việc chuẩn hoá response.</summary>
public class LogExceptionFilter(ILogger<LogExceptionFilter> logger) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        if (executed.Exception is not null && !executed.ExceptionHandled)
            logger.LogError(executed.Exception, "Lỗi chưa xử lý tại {Path}", context.HttpContext.Request.Path);
    }
}
