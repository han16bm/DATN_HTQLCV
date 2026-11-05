using Shared.Entities.Auditing;
using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class Unit : ICreateStamped, IUpdateStamped
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public string Name { get; set; } = null!;
    public string? ParentId { get; set; }
    public string? ManagerId { get; set; }
    public OrgStatus Status { get; set; }

    public Unit? Parent { get; set; }
}
