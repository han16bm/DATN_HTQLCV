using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Shared.Commons.Extensions;

public static class HttpContextExtensions
{
    public static string? GetUserId(this HttpContext context) =>
        context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.User.FindFirstValue("sub");

    public static string GetTraceId(this HttpContext context) => context.TraceIdentifier;
}
