using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Shared.Commons.Exceptions;
using Shared.Commons.Utils;

namespace Shared.Commons.Storage;

/// <summary>
/// Cloudinary: ảnh Public lưu type "upload" (URL CDN công khai, public_id ngẫu nhiên);
/// tệp Private lưu resource "raw" type "private" — chỉ tải được bằng URL API có chữ ký ngắn hạn do BE tạo,
/// BE đọc rồi trả về cho FE sau khi kiểm quyền (minh chứng là dữ liệu nội bộ).
/// </summary>
internal sealed class CloudinaryFileStorage
{
    private const string Prefix = "cloudinary:";
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(60) };
    private readonly Cloudinary _cloudinary;
    private readonly string _folder;

    public CloudinaryFileStorage(CloudinaryStorageOptions options)
    {
        _cloudinary = new Cloudinary(new Account(options.CloudName, options.ApiKey, options.ApiSecret));
        _cloudinary.Api.Secure = true;
        _folder = options.Folder.Trim('/');
    }

    public async Task<StoredFile> SaveAsync(Stream content, string fileName, string contentType, string folder,
        StoredFileAccess access, CancellationToken cancellationToken)
    {
        var assetFolder = string.IsNullOrEmpty(_folder) ? folder : $"{_folder}/{folder}";
        var id = GuidGenerator.NewId();
        var file = new FileDescription(fileName, content);
        var type = access == StoredFileAccess.Public ? "upload" : "private";

        UploadResult result;
        string resourceType;
        if (access == StoredFileAccess.Public && contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            resourceType = "image";
            result = await _cloudinary.UploadAsync(new ImageUploadParams
            {
                File = file,
                PublicId = $"{assetFolder}/{id}",
                AssetFolder = assetFolder,
                Type = type,
                Overwrite = false
            }, cancellationToken);
        }
        else
        {
            // public_id của raw giữ đuôi tệp để Cloudinary trả đúng định dạng khi tải.
            resourceType = "raw";
            result = await _cloudinary.UploadAsync(new RawUploadParams
            {
                File = file,
                PublicId = $"{assetFolder}/{id}{FileNames.ExtensionFor(contentType, fileName)}",
                AssetFolder = assetFolder,
                Type = type,
                Overwrite = false
            }, "raw", cancellationToken);
        }

        if (result.Error is not null || string.IsNullOrEmpty(result.PublicId))
            throw new StorageUnavailableException($"Không lưu được tệp lên Cloudinary: {result.Error?.Message ?? "không rõ lỗi"}.");

        var url = access == StoredFileAccess.Public ? result.SecureUrl?.ToString() : null;
        return new StoredFile($"{Prefix}{type}:{resourceType}:{result.PublicId}", url, result.Bytes);
    }

    public async Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        var (type, resourceType, publicId) = Parse(key);
        var url = _cloudinary.DownloadPrivate(publicId, attachment: false, format: string.Empty, type: type,
            expiresAt: DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds(), resourceType: resourceType);
        var response = await Http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            response.Dispose();
            return null;
        }
        if (!response.IsSuccessStatusCode)
        {
            var status = (int)response.StatusCode;
            response.Dispose();
            throw new StorageUnavailableException($"Kho lưu trữ trả lỗi {status} khi tải tệp.");
        }
        return await response.Content.ReadAsStreamAsync(cancellationToken);
    }

    public async Task DeleteAsync(string key)
    {
        var (type, resourceType, publicId) = Parse(key);
        await _cloudinary.DestroyAsync(new DeletionParams(publicId)
        {
            Type = type,
            ResourceType = resourceType == "raw" ? ResourceType.Raw : ResourceType.Image,
            Invalidate = true
        });
    }

    public static bool Owns(string key) => key.StartsWith(Prefix, StringComparison.Ordinal);

    private static (string Type, string ResourceType, string PublicId) Parse(string key)
    {
        var parts = key[Prefix.Length..].Split(':', 3);
        if (parts.Length != 3) throw new StorageUnavailableException("Khoá tệp Cloudinary không hợp lệ.");
        return (parts[0], parts[1], parts[2]);
    }
}

/// <summary>Kho lưu trữ ngoài (Cloudinary) lỗi hoặc chưa cấu hình — 503 để FE báo thử lại.</summary>
public class StorageUnavailableException : AppException
{
    public StorageUnavailableException(string message) : base(message, 100503)
    {
        Code = "STORAGE_UNAVAILABLE";
    }
}
