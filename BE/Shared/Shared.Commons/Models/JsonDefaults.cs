using System.Text.Json;

namespace Shared.Commons.Models;

/// <summary>camelCase giống mặc định của AddControllers() — dùng cho chỗ ghi JSON ngoài pipeline MVC (ví dụ JwtBearerEvents).</summary>
public static class JsonDefaults
{
    public static readonly JsonSerializerOptions Web = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
}
