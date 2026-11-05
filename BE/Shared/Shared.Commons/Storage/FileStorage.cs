using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Shared.Commons.Storage;

/// <summary>
/// Tệp mới vào provider đang bật; tệp cũ đọc/xoá theo tiền tố khoá ("cloudinary:" / "local:" / đường dẫn tuyệt đối cũ),
/// nên đổi provider không làm hỏng minh chứng đã lưu trước đó. Cấu hình lấy từ cấu hình tập trung (SystemConfigs,
/// nhóm STORAGE) qua IOptionsMonitor: sửa ở màn Cấu hình tập trung có hiệu lực sau chu kỳ reload, không cần khởi động lại.
/// </summary>
public sealed class FileStorage : IFileStorage
{
    private readonly string _contentRoot;
    private readonly string _localRoot;
    private readonly ILogger<FileStorage> _logger;
    private volatile Backends _current;

    private sealed record Backends(string Provider, LocalFileStorage Local, CloudinaryFileStorage? Cloudinary);

    public FileStorage(IOptionsMonitor<StorageOptions> options, string contentRoot, ILogger<FileStorage> logger)
    {
        _contentRoot = Path.GetFullPath(contentRoot);
        _logger = logger;
        // LocalRoot là cấu hình hạ tầng: chốt lúc khởi động (không nhận đổi nóng) và phải nằm trong thư mục service.
        _localRoot = Path.GetFullPath(Path.Combine(_contentRoot, options.CurrentValue.LocalRoot));
        if (!_localRoot.StartsWith(_contentRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Storage:LocalRoot phải là thư mục con của thư mục service.");
        _current = Build(options.CurrentValue);
        options.OnChange(o =>
        {
            try
            {
                _current = Build(o);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cấu hình lưu tệp mới không hợp lệ — giữ cấu hình cũ ({Provider}).", _current.Provider);
            }
        });
    }

    private Backends Build(StorageOptions options)
    {
        var local = new LocalFileStorage(_localRoot, options.PublicBaseUrl);
        var cloud = WithEnvironmentUrl(options.Cloudinary);
        var provider = options.Provider.Trim();
        if (provider.Equals("Cloudinary", StringComparison.OrdinalIgnoreCase) && !cloud.IsConfigured)
            _logger.LogWarning("Storage:Provider = Cloudinary nhưng thiếu CloudName/ApiKey/ApiSecret — tạm lưu cục bộ.");
        var cloudinary = cloud.IsConfigured ? new CloudinaryFileStorage(cloud) : null;
        var active = cloudinary is not null && !provider.Equals("Local", StringComparison.OrdinalIgnoreCase) ? "Cloudinary" : "Local";
        _logger.LogInformation("Lưu tệp qua {Provider}{Detail}.", active,
            active == "Local" ? $" ({_localRoot})" : $" (cloud {cloud.CloudName})");
        return new Backends(active, local, cloudinary);
    }

    public string Provider => _current.Provider;
    public Task<StoredFile> SaveAsync(Stream content, string fileName, string contentType, string folder,
        StoredFileAccess access, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(folder) || !folder.All(c => char.IsAsciiLetterLower(c) || char.IsAsciiDigit(c) || c == '-'))
            throw new ArgumentException("Tên nhóm tệp chỉ gồm chữ thường, số và gạch ngang.", nameof(folder));
        var backends = _current;
        return backends.Cloudinary is not null && backends.Provider == "Cloudinary"
            ? backends.Cloudinary.SaveAsync(content, fileName, contentType, folder, access, cancellationToken)
            : backends.Local.SaveAsync(content, fileName, contentType, folder, access, cancellationToken);
    }

    public async Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken = default)
    {
        var backends = _current;
        if (!CloudinaryFileStorage.Owns(key))
            return backends.Local.OpenRead(key);
        if (backends.Cloudinary is null)
            throw new StorageUnavailableException("Tệp nằm trên Cloudinary nhưng máy chủ chưa cấu hình Cloudinary.");
        return await backends.Cloudinary.OpenReadAsync(key, cancellationToken);
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var backends = _current;
            if (!CloudinaryFileStorage.Owns(key)) backends.Local.Delete(key);
            else if (backends.Cloudinary is not null) await backends.Cloudinary.DeleteAsync(key);
        }
        catch (Exception ex)
        {
            // Xoá tệp cũ là dọn dẹp: lỗi kho lưu trữ không được làm hỏng thao tác chính.
            _logger.LogWarning(ex, "Không xoá được tệp {Key}.", key);
        }
    }

    /// <summary>CLOUDINARY_URL=cloudinary://{api_key}:{api_secret}@{cloud_name} bổ sung phần còn thiếu trong cấu hình.</summary>
    private static CloudinaryStorageOptions WithEnvironmentUrl(CloudinaryStorageOptions options)
    {
        var url = Environment.GetEnvironmentVariable("CLOUDINARY_URL");
        if (options.IsConfigured || string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri)
            || uri.Scheme != "cloudinary")
            return options;
        var credentials = Uri.UnescapeDataString(uri.UserInfo).Split(':', 2);
        return new CloudinaryStorageOptions
        {
            CloudName = string.IsNullOrWhiteSpace(options.CloudName) ? uri.Host : options.CloudName,
            ApiKey = string.IsNullOrWhiteSpace(options.ApiKey) ? credentials[0] : options.ApiKey,
            ApiSecret = string.IsNullOrWhiteSpace(options.ApiSecret) && credentials.Length == 2 ? credentials[1] : options.ApiSecret,
            Folder = options.Folder
        };
    }
}

public static class FileStorageServiceCollectionExtensions
{
    public static IServiceCollection AddFileStorage(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.Section));
        services.AddSingleton<IFileStorage>(sp => new FileStorage(
            sp.GetRequiredService<IOptionsMonitor<StorageOptions>>(),
            sp.GetRequiredService<IHostEnvironment>().ContentRootPath,
            sp.GetRequiredService<ILogger<FileStorage>>()));
        return services;
    }
}
