namespace Shared.Commons.Storage;

/// <summary>
/// Cấu hình lưu tệp (section "Storage"): Provider, PublicBaseUrl và Cloudinary:* nằm ở cấu hình tập trung (SystemConfigs,
/// nhóm STORAGE — ApiSecret lưu mã hoá); LocalRoot là cấu hình hạ tầng của từng service, giữ mặc định trong code.
/// Provider "Auto": dùng Cloudinary khi đủ CloudName + ApiKey + ApiSecret (hoặc biến môi trường CLOUDINARY_URL),
/// ngược lại lưu đĩa cục bộ để dev vẫn chạy được khi chưa có secret.
/// </summary>
public sealed class StorageOptions
{
    public const string Section = "Storage";

    /// <summary>"Auto" | "Cloudinary" | "Local".</summary>
    public string Provider { get; set; } = "Auto";

    /// <summary>Gốc URL công khai của gateway; dựng link ảnh khi lưu cục bộ (FE :3000 và gateway :5000 khác origin).</summary>
    public string PublicBaseUrl { get; set; } = "http://localhost:5000";

    /// <summary>Thư mục lưu cục bộ, tương đối content root của service; nằm ngoài wwwroot để không bị phục vụ tĩnh.</summary>
    public string LocalRoot { get; set; } = "App_Data/storage";

    public CloudinaryStorageOptions Cloudinary { get; set; } = new();
}

public sealed class CloudinaryStorageOptions
{
    public string? CloudName { get; set; }
    public string? ApiKey { get; set; }
    public string? ApiSecret { get; set; }

    /// <summary>Thư mục gốc trên Cloudinary, ví dụ "datn" → datn/avatars, datn/evidence.</summary>
    public string Folder { get; set; } = "datn";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(CloudName) && !string.IsNullOrWhiteSpace(ApiKey) && !string.IsNullOrWhiteSpace(ApiSecret);
}
