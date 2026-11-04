namespace Shared.Entities.Entities;

/// <summary>
/// Một dòng gộp cho mỗi cặp (Ip, Scope) có request không khớp entry whitelist Active nào (§10.2).
/// Đếm lượt bằng upsert SQL ở IpAccessRecorder; ResolvedBy/ResolvedAt do allow/dismiss gán tường minh.
/// </summary>
public class IpAccessLog
{
    public const string StatusPending = "PENDING";
    public const string StatusAllowed = "ALLOWED";
    public const string StatusDismissed = "DISMISSED";

    public string Id { get; set; } = null!;
    public int Version { get; set; }

    public string Ip { get; set; } = null!;
    public string Scope { get; set; } = null!;
    public DateTime FirstSeenAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public int HitCount { get; set; }
    public int BlockedCount { get; set; }
    public string? LastUserId { get; set; }
    public string? LastUsername { get; set; }
    public string LastPath { get; set; } = null!;
    public string Status { get; set; } = StatusPending;
    public string? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolveNote { get; set; }
}
