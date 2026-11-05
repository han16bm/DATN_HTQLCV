namespace Shared.Commons.Storage;

/// <summary>Public: có URL công khai (ảnh đại diện). Private: chỉ đọc qua BE sau khi kiểm quyền (minh chứng).</summary>
public enum StoredFileAccess
{
    Public,
    Private
}

/// <param name="Key">Khoá lưu trong DB: "cloudinary:{type}:{resourceType}:{publicId}" hoặc "local:{folder}/{name}".</param>
/// <param name="PublicUrl">URL tuyệt đối khi Access = Public, null khi Private.</param>
public sealed record StoredFile(string Key, string? PublicUrl, long Bytes);

public interface IFileStorage
{
    /// <summary>"Cloudinary" hoặc "Local" — provider nhận tệp mới.</summary>
    string Provider { get; }

    /// <param name="folder">Nhóm tệp, chỉ gồm chữ thường/số/gạch ngang (ví dụ "avatars", "evidence").</param>
    Task<StoredFile> SaveAsync(Stream content, string fileName, string contentType, string folder, StoredFileAccess access,
        CancellationToken cancellationToken = default);

    /// <summary>Mở nội dung theo khoá; null khi tệp không còn trên kho lưu trữ.</summary>
    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>Xoá tệp, bỏ qua khi tệp không còn (best effort).</summary>
    Task DeleteAsync(string key, CancellationToken cancellationToken = default);
}
