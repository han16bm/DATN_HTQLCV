using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Shared.Commons.Exceptions;
using Shared.Commons.Models;

namespace Shared.Commons.Attributes;

/// <summary>
/// Chuẩn hoá lỗi controller về {code, message, fieldErrors?, details?} kèm mã HTTP thật
/// (404/403/409/412/422/428...). Response thành công đi thẳng, không bọc — khớp contract FE
/// (xem FE/docs/IMPLEMENTATION_STATUS.md: "success là DTO, lỗi là code/message/fieldErrors?/details?").
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuditAttribute : ActionFilterAttribute
{
    public AuditAttribute()
    {
        Order = int.MinValue;
    }

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var fieldErrors = context.ModelState
                .Where(kv => kv.Value?.Errors.Count > 0)
                .Select(kv => new FieldErrorItem(ToPath(kv.Key), kv.Value!.Errors[0].ErrorMessage))
                .ToList();

            context.Result = new ObjectResult(new ErrorResponse("VALIDATION", "Dữ liệu gửi lên không hợp lệ.", fieldErrors))
            {
                StatusCode = StatusCodes.Status422UnprocessableEntity
            };
        }

        base.OnActionExecuting(context);
    }

    public override void OnActionExecuted(ActionExecutedContext context)
    {
        if (context.Exception is not null)
        {
            var (status, code, message) = Describe(context.Exception);
            context.Result = new ObjectResult(new ErrorResponse(code, message)) { StatusCode = status };
            context.ExceptionHandled = true;
        }

        base.OnActionExecuted(context);
    }

    private static List<string> ToPath(string key)
    {
        var parts = key.Split('.', StringSplitOptions.RemoveEmptyEntries);
        var path = new List<string>();
        foreach (var part in parts)
        {
            path.Add(part.Length > 0 ? char.ToLowerInvariant(part[0]) + part[1..] : part);
        }
        return path;
    }

    private static (int Status, string Code, string Message) Describe(Exception ex)
    {
        if (ex is AppException appEx)
        {
            var status = appEx.ErrorCode % 1000;
            return (status, CodeFor(status), appEx.Message);
        }
        return (StatusCodes.Status500InternalServerError, "SYSTEM_ERROR", "Có lỗi hệ thống, vui lòng thử lại.");
    }

    private static string CodeFor(int status)
    {
        switch (status)
        {
            case 401: return "UNAUTHORIZED";
            case 403: return "FORBIDDEN";
            case 404: return "NOT_FOUND";
            case 409: return "CONFLICT";
            case 412: return "PRECONDITION_FAILED";
            case 422: return "VALIDATION";
            case 428: return "PRECONDITION_REQUIRED";
            case 429: return "RATE_LIMITED";
            default: return "SYSTEM_ERROR";
        }
    }
}
