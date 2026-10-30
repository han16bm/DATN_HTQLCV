using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class User
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string Username { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string UnitId { get; set; } = null!;
    public SystemRole SystemRole { get; set; }
    public UserStatus Status { get; set; }

    public DateTime? LockedAt { get; set; }
    public string? LockReason { get; set; }
    public int FailedLoginCount { get; set; }
    public int TokenVersion { get; set; }

    public Unit? Unit { get; set; }
}
