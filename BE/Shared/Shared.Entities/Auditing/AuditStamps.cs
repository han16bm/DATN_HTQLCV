namespace Shared.Entities.Auditing;

/// <summary>Người/thời điểm tạo — tương ứng NGUOI_TAO/NGAY_TAO của DVCLT. Do <see cref="AuditStampInterceptor"/> tự điền.</summary>
public interface ICreateStamped
{
    DateTime CreatedAt { get; set; }
    string? CreatedBy { get; set; }
}

/// <summary>Người/thời điểm sửa cuối — tương ứng NGUOI_SUA/NGAY_SUA của DVCLT. Do <see cref="AuditStampInterceptor"/> tự điền.</summary>
public interface IUpdateStamped
{
    DateTime UpdatedAt { get; set; }
    string? UpdatedBy { get; set; }
}

/// <summary>
/// Cột kỹ thuật: một lần lưu chỉ đổi các cột này (đếm đăng nhập sai, security stamp, lịch chạy job…) không bị tính
/// là "sửa" nên không ghi đè người sửa cuối thật.
/// </summary>
[AttributeUsage(AttributeTargets.Property)]
public sealed class NoAuditStampAttribute : Attribute;

/// <summary>
/// Ghi đè người thao tác cho một đoạn code (theo luồng async). Dùng khi việc chạy trong request nhưng bản chất là của
/// hệ thống — ví dụ admin bấm "Chạy ngay" job: cảnh báo do job sinh vẫn ghi "SYSTEM", còn người bấm nằm ở JobRun.TriggeredBy.
/// </summary>
public static class AuditActorScope
{
    private static readonly AsyncLocal<string?> Current = new();

    public static string? Override => Current.Value;

    public static IDisposable Use(string actorId)
    {
        var previous = Current.Value;
        Current.Value = actorId;
        return new Restore(previous);
    }

    private sealed class Restore(string? previous) : IDisposable
    {
        public void Dispose()
        {
            Current.Value = previous;
        }
    }
}

public static class AuditActors
{
    /// <summary>Người thao tác khi không có request đăng nhập: job nền, khoá tự động khi đăng nhập sai…</summary>
    public const string System = "SYSTEM";
    public const string SystemLabel = "Hệ thống";
}
