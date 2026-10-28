namespace Shared.Commons.Models;

public class Result<T>(bool succeeded, object? errors, T? data, string? traceId, int statusCode)
{
    public bool Succeeded { get; set; } = succeeded;
    public object? Errors { get; init; } = errors;
    public T? Data { get; init; } = data;
    public string? TraceId { get; set; } = traceId;
    public int StatusCode { get; set; } = statusCode;

    public static Result<T> Success(T? data, string? traceId) => new(true, null, data, traceId, ErrorCodes.Success);

    public static Result<T> Failure(object errors, string? traceId, int statusCode = ErrorCodes.SystemError) =>
        new(false, errors, default, traceId, statusCode);
}
