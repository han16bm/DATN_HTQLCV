using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class Team
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string Name { get; set; } = null!;
    public string UnitId { get; set; } = null!;
    public OrgStatus Status { get; set; }

    public List<TeamMember> Members { get; set; } = [];
}

public class TeamMember
{
    public string TeamId { get; set; } = null!;
    public string UserId { get; set; } = null!;

    public Team? Team { get; set; }
    public User? User { get; set; }
}
