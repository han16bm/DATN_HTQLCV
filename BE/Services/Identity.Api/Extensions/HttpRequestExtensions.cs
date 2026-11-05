namespace Identity.Api.Extensions;

public static class HttpRequestExtensions
{
    /// <summary>Đọc If-Match dạng số nguyên; trả 0 khi thiếu để service tự báo PreconditionRequired.</summary>
    public static int GetIfMatchVersion(this HttpRequest request)
    {
        var raw = request.Headers.IfMatch.ToString().Trim('"');
        return int.TryParse(raw, out var version) ? version : 0;
    }
}
