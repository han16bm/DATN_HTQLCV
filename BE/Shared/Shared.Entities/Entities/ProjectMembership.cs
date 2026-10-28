using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class ProjectMembership
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string ProjectId { get; set; } = null!;
    public string UserId { get; set; } = null!;
    public ProjectRole ProjectRole { get; set; }
    public DateTime? EndedAt { get; set; }

    public Project? Project { get; set; }
    public User? User { get; set; }
}
