using Shared.Entities.Auditing;
using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class User : ICreateStamped, IUpdateStamped
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public string Username { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string UnitId { get; set; } = null!;
    public UserStatus Status { get; set; }

    public bool IsSysAdmin { get; set; }
    public List<string> GrantedFeatures { get; set; } = [];
    public List<string> RevokedFeatures { get; set; } = [];

    public DateTime? LockedAt { get; set; }
    public string? LockReason { get; set; }
    [NoAuditStamp]
    public int FailedLoginCount { get; set; }
    [NoAuditStamp]
    public int TokenVersion { get; set; }

    public Unit? Unit { get; set; }
}
