using Serilog.Context;

namespace Gateway.Middleware;

public class TraceIdMiddleware(RequestDelegate next)
{
    private const string HeaderName = "X-Trace-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var traceId = ResolveTraceId(context);
        context.Items["TraceId"] = traceId;
        context.Request.Headers[HeaderName] = traceId;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[HeaderName] = traceId;
            return Task.CompletedTask;
        });

        using (LogContext.PushProperty("GatewayTraceId", traceId))
        {
            await next(context);
        }
    }

    private static string ResolveTraceId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(HeaderName, out var existing) && !string.IsNullOrWhiteSpace(existing))
        {
            return existing.ToString();
        }
        return Guid.NewGuid().ToString("N");
    }
}
