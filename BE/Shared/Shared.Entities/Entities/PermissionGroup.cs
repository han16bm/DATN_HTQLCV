using Shared.Entities.Auditing;
using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class PermissionGroup : ICreateStamped, IUpdateStamped
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public string Code { get; set; } = null!;
    public bool IsSystem { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public OrgStatus Status { get; set; }
    public List<string> Features { get; set; } = [];

    public List<PermissionGroupMember> Members { get; set; } = [];
}

public class PermissionGroupMember
{
    public string PermissionGroupId { get; set; } = null!;
    public string UserId { get; set; } = null!;

    public PermissionGroup? PermissionGroup { get; set; }
    public User? User { get; set; }
}
