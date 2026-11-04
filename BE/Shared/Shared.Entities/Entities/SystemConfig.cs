using Shared.Entities.Auditing;

namespace Shared.Entities.Entities;

/// <summary>
/// Cấu hình tập trung (tương ứng UD_CAUHINH của DVCLT) — chỉ một cột <see cref="Value"/>, mỗi môi trường là một DB riêng.
/// Key là đường dẫn IConfiguration ("Auth:MaxFailedAttempts"); Shared.Configuration nạp các dòng IsActive của
/// ServiceType 'Global' và của service hiện tại vào IConfiguration. Không bao giờ chứa secret, connection string hay URL hạ tầng.
/// </summary>
public class SystemConfig : ICreateStamped, IUpdateStamped
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public string Key { get; set; } = null!;
    public string ServiceType { get; set; } = null!;
    public string Group { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string DataType { get; set; } = null!;
    public string Value { get; set; } = null!;
    public bool IsActive { get; set; }
}

public class IpWhitelistEntry : ICreateStamped, IUpdateStamped
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public string? CreatedBy { get; set; }

    public string Cidr { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
