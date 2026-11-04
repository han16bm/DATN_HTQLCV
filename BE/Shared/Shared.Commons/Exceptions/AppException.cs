using Shared.Commons.Models;

namespace Shared.Commons.Exceptions;

public class AppException : Exception
{
    public int ErrorCode { get; }

    /// <summary>Ghi đè mã lỗi chữ mặc định suy từ HTTP status (ví dụ 422 → "BUSINESS_RULE" thay vì "VALIDATION").</summary>
    public string? Code { get; init; }

    public List<FieldErrorItem>? FieldErrors { get; init; }

    /// <summary>Dữ liệu phụ cho UI, trả ra field "details" của body lỗi (ví dụ { ip, scope }).</summary>
    public object? Details { get; init; }

    public AppException(string message, int errorCode = ErrorCodes.SystemError) : base(message)
    {
        ErrorCode = errorCode;
    }
}
