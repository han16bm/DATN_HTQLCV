using Shared.Entities.Auditing;
using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class ProjectMembership : ICreateStamped, IUpdateStamped
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public string ProjectId { get; set; } = null!;
    public string UserId { get; set; } = null!;
    public ProjectRole ProjectRole { get; set; }
    public DateTime? EndedAt { get; set; }

    public Project? Project { get; set; }
    public User? User { get; set; }
}
