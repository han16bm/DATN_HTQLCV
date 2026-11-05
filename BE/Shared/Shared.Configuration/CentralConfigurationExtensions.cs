using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.EnvironmentVariables;
using Microsoft.Extensions.Configuration.Json;
using Microsoft.Extensions.DependencyInjection;

namespace Shared.Configuration;

public interface ICentralConfigReloader
{
    /// <summary>Đọc lại SystemConfigs ngay trong process hiện tại (service khác tự nhận sau tối đa ReloadSeconds).</summary>
    void Reload();
}

public class CentralConfigReloader(IConfiguration configuration) : ICentralConfigReloader
{
    public void Reload()
    {
        if (configuration is not IConfigurationRoot root) return;
        foreach (var provider in root.Providers.OfType<CentralConfigurationProvider>())
            provider.Reload();
    }
}

public static class CentralConfigurationExtensions
{
    public const string SharedSettingsFileName = "appsettings.Shared.json";
    public const string SharedSettingsPathVariable = "DATN_SHARED_SETTINGS";

    /// <summary>
    /// Thứ tự ưu tiên (thấp → cao): appsettings của service → appsettings.Shared.json → DB (SystemConfigs)
    /// → user-secrets → biến môi trường → command line. Secret và cấu hình cứu hộ qua biến môi trường luôn thắng DB.
    /// </summary>
    public static WebApplicationBuilder AddCentralConfiguration(this WebApplicationBuilder builder, string serviceType)
    {
        IConfigurationBuilder configuration = builder.Configuration;
        var insertAt = FindOverrideIndex(configuration.Sources);

        var sharedPath = LocateSharedSettings(builder.Environment.ContentRootPath);
        if (sharedPath is not null)
        {
            configuration.Sources.Insert(insertAt, new JsonConfigurationSource
            {
                Path = sharedPath,
                Optional = true,
                ReloadOnChange = false,
                FileProvider = null
            }.WithResolvedProvider());
            insertAt++;
        }

        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                $"Thiếu ConnectionStrings:DefaultConnection. Tạo {SharedSettingsFileName} ở thư mục BE (xem appsettings.Shared.example.json), " +
                $"đặt biến môi trường ConnectionStrings__DefaultConnection, hoặc trỏ {SharedSettingsPathVariable} tới file cấu hình chung.");

        var reloadSeconds = builder.Configuration.GetValue("CentralConfig:ReloadSeconds", 30);
        configuration.Sources.Insert(insertAt,
            new CentralConfigurationSource(connectionString, serviceType, TimeSpan.FromSeconds(Math.Max(reloadSeconds, 0)),
                ConfigSecretBox.RootSecret(builder.Configuration)));

        // Không throw để `dotnet ef` vẫn dựng được host trên DB chưa migrate; chỉ cảnh báo rõ ràng
        var missing = ConfigCatalog.Known
            .Where(d => d.Required && (d.ServiceType == ConfigCatalog.Global || d.ServiceType == serviceType))
            .Where(d => string.IsNullOrWhiteSpace(builder.Configuration[d.Key]))
            .Select(d => d.Key)
            .ToList();
        if (missing.Count > 0)
            Console.Error.WriteLine(
                $"[CentralConfig:{serviceType}] Thiếu cấu hình bắt buộc: {string.Join(", ", missing)}. " +
                "Kiểm tra bảng SystemConfigs đã migrate/seed và kết nối DB.");

        builder.Services.AddSingleton<ICentralConfigReloader, CentralConfigReloader>();
        return builder;
    }

    // Chèn trước user-secrets/biến môi trường/command line để chúng vẫn ghi đè được DB
    private static int FindOverrideIndex(IList<IConfigurationSource> sources)
    {
        for (var i = 0; i < sources.Count; i++)
        {
            var source = sources[i];
            if (source is EnvironmentVariablesConfigurationSource)
                return i;
            if (source is JsonConfigurationSource json && string.Equals(json.Path, "secrets.json", StringComparison.OrdinalIgnoreCase))
                return i;
            if (source.GetType().Name == "CommandLineConfigurationSource")
                return i;
        }
        return sources.Count;
    }

    private static string? LocateSharedSettings(string contentRoot)
    {
        var explicitPath = Environment.GetEnvironmentVariable(SharedSettingsPathVariable);
        if (!string.IsNullOrWhiteSpace(explicitPath))
            return File.Exists(explicitPath)
                ? Path.GetFullPath(explicitPath)
                : throw new InvalidOperationException($"{SharedSettingsPathVariable} trỏ tới file không tồn tại: {explicitPath}");

        foreach (var start in new[] { contentRoot, AppContext.BaseDirectory })
        {
            var dir = new DirectoryInfo(start);
            for (var depth = 0; dir is not null && depth < 6; depth++, dir = dir.Parent)
            {
                var candidate = Path.Combine(dir.FullName, SharedSettingsFileName);
                if (File.Exists(candidate)) return candidate;
            }
        }
        return null;
    }

    private static JsonConfigurationSource WithResolvedProvider(this JsonConfigurationSource source)
    {
        source.ResolveFileProvider();
        return source;
    }
}
