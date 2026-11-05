using System.Text.Json;

namespace Identity.Api.Models.Dtos;

public record AuditLogRowDto(string Id, DateTime At, string EntityType, string EntityId, string Action, RefDto Actor, string? Reason);

public record AuditLogDto(
    string Id, DateTime At, string EntityType, string EntityId, string Action, RefDto Actor, string? Reason,
    JsonElement? Before, JsonElement? After);

/// <summary>Cấu hình tập trung. Known/RequiresRestart/Min/Max/AllowedValues tính từ ConfigCatalog, không phải cột DB.</summary>
public record SystemConfigDto(
    string Id,
    int Version,
    string Key,
    string ServiceType,
    string Group,
    string Name,
    string? Description,
    string DataType,
    string Value,
    bool IsActive,
    bool Known,
    bool RequiresRestart,
    int? MinValue,
    int? MaxValue,
    string[]? AllowedValues,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    RefDto? CreatedBy,
    RefDto? UpdatedBy,
    // Cấu hình bí mật: Value luôn rỗng, SecretSet cho biết đã nhập hay chưa.
    bool Secret = false,
    bool SecretSet = false);

public record IpWhitelistEntryDto(
    string Id,
    int Version,
    string Cidr,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    RefDto? CreatedBy,
    RefDto? UpdatedBy);

/// <summary>Bật/tắt và đổi phạm vi đều qua PATCH /api/settings/{id} (settingId / scopeSettingId) với If-Match tương ứng.</summary>
public record IpWhitelistDto(
    bool Enabled,
    string SettingId,
    int SettingVersion,
    string Scope,
    string ScopeSettingId,
    int ScopeSettingVersion,
    int PendingCount,
    string CurrentIp,
    List<IpWhitelistEntryDto> Entries);

public record IpAccessLogDto(
    string Id,
    int Version,
    string Ip,
    string Scope,
    DateTime FirstSeenAt,
    DateTime LastSeenAt,
    int HitCount,
    int BlockedCount,
    RefDto? LastUser,
    string? LastUsername,
    string LastPath,
    string Status,
    RefDto? ResolvedBy,
    DateTime? ResolvedAt,
    string? ResolveNote);

public record IpAccessLogAllowResultDto(IpAccessLogDto Log, IpWhitelistEntryDto Entry);
