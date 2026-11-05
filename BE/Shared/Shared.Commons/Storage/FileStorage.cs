using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Shared.Commons.Storage;

/// <summary>
/// Tệp mới vào provider đang bật; tệp cũ đọc/xoá theo tiền tố khoá ("cloudinary:" / "local:" / đường dẫn tuyệt đối cũ),
/// nên đổi provider không làm hỏng minh chứng đã lưu trước đó.
/// </summary>
public sealed class FileStorage : IFileStorage
{
    private readonly LocalFileStorage _local;
    private readonly CloudinaryFileStorage? _cloudinary;
    private readonly ILogger<FileStorage> _logger;

    public FileStorage(StorageOptions options, string contentRoot, ILogger<FileStorage> logger)
    {
        _logger = logger;
        _local = new LocalFileStorage(Path.Combine(contentRoot, options.LocalRoot), options.PublicBaseUrl);
        var cloud = WithEnvironmentUrl(options.Cloudinary);
        var provider = options.Provider.Trim();
        if (provider.Equals("Cloudinary", StringComparison.OrdinalIgnoreCase) && !cloud.IsConfigured)
            throw new InvalidOperationException(
                "Storage:Provider = Cloudinary nhưng thiếu Storage:Cloudinary:CloudName/ApiKey/ApiSecret (đặt trong BE/appsettings.Shared.json hoặc biến môi trường CLOUDINARY_URL).");

        if (cloud.IsConfigured)
            _cloudinary = new CloudinaryFileStorage(cloud);
        Provider = _cloudinary is not null && !provider.Equals("Local", StringComparison.OrdinalIgnoreCase) ? "Cloudinary" : "Local";

        if (Provider == "Local" && !provider.Equals("Local", StringComparison.OrdinalIgnoreCase))
            logger.LogWarning(
                "Cloudinary chưa đủ cấu hình (cần CloudName, ApiKey và ApiSecret) — tệp mới lưu cục bộ tại {Root}.",
                Path.GetFullPath(Path.Combine(contentRoot, options.LocalRoot)));
        else
            logger.LogInformation("Lưu tệp qua {Provider}.", Provider);
    }

    public string Provider { get; }

    public Task<StoredFile> SaveAsync(Stream content, string fileName, string contentType, string folder,
        StoredFileAccess access, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(folder) || !folder.All(c => char.IsAsciiLetterLower(c) || char.IsAsciiDigit(c) || c == '-'))
            throw new ArgumentException("Tên nhóm tệp chỉ gồm chữ thường, số và gạch ngang.", nameof(folder));
        return _cloudinary is not null && Provider == "Cloudinary"
            ? _cloudinary.SaveAsync(content, fileName, contentType, folder, access, cancellationToken)
            : _local.SaveAsync(content, fileName, contentType, folder, access, cancellationToken);
    }

    public async Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken = default)
    {
        if (!CloudinaryFileStorage.Owns(key))
            return _local.OpenRead(key);
        if (_cloudinary is null)
            throw new StorageUnavailableException("Tệp nằm trên Cloudinary nhưng máy chủ chưa cấu hình Cloudinary.");
        return await _cloudinary.OpenReadAsync(key, cancellationToken);
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!CloudinaryFileStorage.Owns(key)) _local.Delete(key);
            else if (_cloudinary is not null) await _cloudinary.DeleteAsync(key);
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
        var options = configuration.GetSection(StorageOptions.Section).Get<StorageOptions>() ?? new StorageOptions();
        services.AddSingleton(options);
        services.AddSingleton<IFileStorage>(sp => new FileStorage(
            options,
            sp.GetRequiredService<IHostEnvironment>().ContentRootPath,
            sp.GetRequiredService<ILogger<FileStorage>>()));
        return services;
    }
}
