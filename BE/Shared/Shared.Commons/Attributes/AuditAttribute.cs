using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;

namespace Shared.Commons.Attributes;

/// <summary>
/// Chuẩn hoá mọi response controller về Result&lt;T&gt;, luôn trả HTTP 200.
/// Lỗi nghiệp vụ/validate nằm trong body (succeeded=false); chỉ lỗi ở biên bảo mật mới dùng mã HTTP thật.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuditAttribute : ActionFilterAttribute
{
    public AuditAttribute() => Order = int.MinValue;

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var traceId = context.HttpContext.GetTraceId();
            var messages = context.ModelState
                .Where(kv => kv.Value?.Errors.Count > 0)
                .SelectMany(kv => kv.Value!.Errors.Select(e => e.ErrorMessage))
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .ToArray();

            context.Result = new OkObjectResult(Result<object>.Failure(messages, traceId, ErrorCodes.Validation));
        }

        base.OnActionExecuting(context);
    }

    public override void OnActionExecuted(ActionExecutedContext context)
    {
        var traceId = context.HttpContext.GetTraceId();

        if (context.Exception is not null)
        {
            var (message, code) = Describe(context.Exception);
            context.Result = new OkObjectResult(Result<object>.Failure(message, traceId, code));
            context.ExceptionHandled = true;
            base.OnActionExecuted(context);
            return;
        }

        if (context.Result is ObjectResult { Value: not null } objectResult && objectResult.Value is not Result<object>)
        {
            context.Result = new OkObjectResult(Result<object>.Success(objectResult.Value, traceId));
        }

        base.OnActionExecuted(context);
    }

    private static (string Message, int Code) Describe(Exception ex) => ex switch
    {
        AppException appEx => (appEx.Message, appEx.ErrorCode),
        _ => ("Có lỗi hệ thống, vui lòng thử lại.", ErrorCodes.SystemError)
    };
}
