using System.Text.RegularExpressions;

namespace Shared.Configuration;

/// <summary>Định nghĩa một key cấu hình đã biết: kiểu dữ liệu và ràng buộc nằm trong code, DB chỉ giữ một cột Value.</summary>
public record ConfigDefinition(
    string Key,
    string ServiceType,
    string Group,
    string Name,
    string Description,
    string DataType,
    string InitialValue,
    int? MinValue = null,
    int? MaxValue = null,
    string[]? AllowedValues = null,
    bool RequiresRestart = false,
    bool Required = false,
    bool Secret = false);

/// <summary>
/// Danh mục key cấu hình tập trung (bảng SystemConfigs). Dùng cho seed, validate khi sửa và hiển thị ràng buộc ở FE.
/// Key tự thêm không được chứa secret (<see cref="IsForbiddenKey"/>); secret chỉ đi qua key đã khai báo Secret = true,
/// được mã hoá (<see cref="ConfigSecretBox"/>) và không bao giờ trả lại giá trị qua API.
/// </summary>
public static class ConfigCatalog
{
    public const string Global = "Global";
    public const string Gateway = "Gateway";
    public const string IdentityApi = "Identity.Api";
    public const string ProjectsApi = "Projects.Api";
    public const string TasksApi = "Tasks.Api";
    public const string AnalyticsApi = "Analytics.Api";

    public const string DataTypeInt = "INT";
    public const string DataTypeBool = "BOOL";
    public const string DataTypeString = "STRING";

    public const string JwtIssuer = "Jwt:Issuer";
    public const string JwtAudience = "Jwt:Audience";
    public const string JwtAccessTokenHours = "Jwt:AccessTokenHours";
    public const string AuthMaxFailedAttempts = "Auth:MaxFailedAttempts";
    public const string AdminIpWhitelistEnabled = "Security:AdminIpWhitelistEnabled";
    public const string SerilogMinimumLevel = "Serilog:MinimumLevel";
    public const string IpWhitelistScope = "Security:IpWhitelistScope";

    public const string StorageProvider = "Storage:Provider";
    public const string StoragePublicBaseUrl = "Storage:PublicBaseUrl";
    public const string CloudinaryCloudName = "Storage:Cloudinary:CloudName";
    public const string CloudinaryApiKey = "Storage:Cloudinary:ApiKey";
    public const string CloudinaryApiSecret = "Storage:Cloudinary:ApiSecret";
    public const string CloudinaryFolder = "Storage:Cloudinary:Folder";
    public const string AnthropicApiKey = "Analytics:Anthropic:ApiKey";
    public const string AnthropicModel = "Analytics:Anthropic:Model";

    public const string IpScopeAdmin = "ADMIN";
    public const string IpScopeSystem = "SYSTEM";

    public static readonly string[] ServiceTypes = [Global, Gateway, IdentityApi, ProjectsApi, TasksApi, AnalyticsApi];
    public static readonly string[] DataTypes = [DataTypeInt, DataTypeBool, DataTypeString];

    public static readonly ConfigDefinition[] Known =
    [
        new(JwtIssuer, Global, "JWT", "JWT issuer",
            "Định danh bên phát token. Mọi service và Gateway phải dùng cùng giá trị.",
            DataTypeString, "datn-identity", RequiresRestart: true, Required: true),
        new(JwtAudience, Global, "JWT", "JWT audience",
            "Đối tượng nhận token. Mọi service và Gateway phải dùng cùng giá trị.",
            DataTypeString, "datn-clients", RequiresRestart: true, Required: true),
        new(JwtAccessTokenHours, IdentityApi, "JWT", "Thời hạn phiên đăng nhập (giờ)",
            "Thời hạn access token cấp khi đăng nhập hoặc làm mới phiên.",
            DataTypeInt, "8", MinValue: 1, MaxValue: 24),
        new(AuthMaxFailedAttempts, IdentityApi, "AUTH", "Số lần đăng nhập sai tối đa",
            "Vượt quá số lần này tài khoản bị khoá tự động.",
            DataTypeInt, "5", MinValue: 3, MaxValue: 20),
        new(AdminIpWhitelistEnabled, Global, "SECURITY", "Bật IP whitelist khu quản trị",
            "Khi bật, chỉ IP khớp danh sách whitelist mới gọi được API quản trị.",
            DataTypeBool, "false"),
        new(SerilogMinimumLevel, Global, "LOGGING", "Mức log tối thiểu",
            "Mức log Serilog áp dụng cho mọi service khi khởi động.",
            DataTypeString, "Information",
            AllowedValues: ["Verbose", "Debug", "Information", "Warning", "Error", "Fatal"], RequiresRestart: true),
        // Thêm cuối danh sách: Id seed theo vị trí (cfg-00N), chèn giữa sẽ đổi Id các dòng đã có
        new(IpWhitelistScope, Global, "SECURITY", "Phạm vi IP whitelist",
            "ADMIN: chỉ chặn API khu quản trị. SYSTEM: chặn mọi API của 4 service, kể cả đăng nhập.",
            DataTypeString, IpScopeAdmin, AllowedValues: [IpScopeAdmin, IpScopeSystem]),
        // Lưu tệp (ảnh đại diện, minh chứng): Auto = Cloudinary khi đủ CloudName/ApiKey/ApiSecret, ngược lại đĩa cục bộ.
        new(StorageProvider, Global, "STORAGE", "Nơi lưu tệp",
            "Auto: Cloudinary khi đã nhập đủ thông tin Cloudinary, ngược lại lưu đĩa cục bộ của service. Local: luôn lưu cục bộ.",
            DataTypeString, "Auto", AllowedValues: ["Auto", "Cloudinary", "Local"]),
        new(StoragePublicBaseUrl, Global, "STORAGE", "Địa chỉ công khai của gateway",
            "Dùng dựng link ảnh đại diện khi lưu cục bộ (FE và gateway khác origin), ví dụ https://api.congty.vn.",
            DataTypeString, "http://localhost:5000"),
        new(CloudinaryCloudName, Global, "STORAGE", "Cloudinary - Cloud name",
            "Product environment (cloud name) trên trang Cloudinary > Settings > API Keys.",
            DataTypeString, ""),
        new(CloudinaryApiKey, Global, "STORAGE", "Cloudinary - API key",
            "API key của Cloudinary (định danh công khai, đi kèm API secret).",
            DataTypeString, ""),
        new(CloudinaryApiSecret, Global, "STORAGE", "Cloudinary - API secret",
            "Bí mật ký yêu cầu Cloudinary. Lưu mã hoá, không hiển thị lại; để trống khi sửa nghĩa là giữ giá trị cũ.",
            DataTypeString, "", Secret: true),
        new(CloudinaryFolder, Global, "STORAGE", "Cloudinary - Thư mục gốc",
            "Thư mục gốc trên Cloudinary, ví dụ datn → datn/avatars, datn/evidence.",
            DataTypeString, "datn"),
        new(AnthropicApiKey, AnalyticsApi, "AI", "Anthropic - API key",
            "Khóa API Claude. Lưu mã hóa trong SystemConfigs và không bao giờ trả giá trị thật về giao diện.",
            DataTypeString, "", Secret: true),
        new(AnthropicModel, AnalyticsApi, "AI", "Anthropic - mô hình Claude",
            "Model ID được gọi bởi Analytics.Api. Chỉ thay đổi nếu model có quyền truy cập trên tài khoản Anthropic.",
            DataTypeString, "claude-opus-5-5")
    ];

    // Secret và cấu hình hạ tầng không bao giờ được nằm trong DB (khác UD_CAUHINH của DVCLT)
    private static readonly Regex ForbiddenKeyPattern = new(
        // Storage:* chỉ nhận các key đã khai báo trong Known (không tự thêm Storage:LocalRoot...).
        @"(^ConnectionStrings:|^CentralConfig:|^Kestrel:|^Storage:|password|secret|signingkey|apikey|privatekey)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex KeyFormat = new(@"^[A-Za-z][A-Za-z0-9_.]*(:[A-Za-z0-9_.]+)*$", RegexOptions.Compiled);

    public static ConfigDefinition? Find(string key, string serviceType)
    {
        return Known.FirstOrDefault(d =>
            string.Equals(d.Key, key, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(d.ServiceType, serviceType, StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsForbiddenKey(string key)
    {
        return ForbiddenKeyPattern.IsMatch(key);
    }

    public static bool IsValidKeyFormat(string key)
    {
        return key.Length <= 200 && KeyFormat.IsMatch(key);
    }

    /// <summary>Chuẩn hoá và kiểm tra giá trị theo DataType và ràng buộc; trả lỗi tiếng Việt khi sai.</summary>
    public static bool TryNormalize(string dataType, string raw, ConfigDefinition? definition, out string value, out string? error)
    {
        value = raw.Trim();
        error = null;
        switch (dataType)
        {
            case DataTypeInt:
                if (!int.TryParse(value, out var number))
                {
                    error = "Giá trị phải là số nguyên.";
                    return false;
                }
                if (definition?.MinValue is { } min && number < min || definition?.MaxValue is { } max && number > max)
                {
                    error = $"Giá trị phải trong khoảng {definition!.MinValue}–{definition.MaxValue}.";
                    return false;
                }
                value = number.ToString();
                return true;
            case DataTypeBool:
                if (!bool.TryParse(value, out var flag))
                {
                    error = "Giá trị phải là true hoặc false.";
                    return false;
                }
                value = flag ? "true" : "false";
                return true;
            case DataTypeString:
                if (value.Length > 2000)
                {
                    error = "Giá trị tối đa 2000 ký tự.";
                    return false;
                }
                if (definition?.Required == true && value.Length == 0)
                {
                    error = "Giá trị không được để trống.";
                    return false;
                }
                if (definition?.AllowedValues is { } allowed)
                {
                    var candidate = value;
                    var match = allowed.FirstOrDefault(a => string.Equals(a, candidate, StringComparison.OrdinalIgnoreCase));
                    if (match is null)
                    {
                        error = $"Giá trị phải là một trong: {string.Join(", ", allowed)}.";
                        return false;
                    }
                    value = match;
                }
                return true;
            default:
                error = "Kiểu dữ liệu không hợp lệ.";
                return false;
        }
    }
}
