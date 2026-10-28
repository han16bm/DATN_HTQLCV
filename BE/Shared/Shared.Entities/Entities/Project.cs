using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class Project
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Objective { get; set; } = null!;
    public string UnitId { get; set; } = null!;
    public string OwnerId { get; set; } = null!;
    public DateOnly StartDate { get; set; }
    public DateTime DueAt { get; set; }
    public ProjectStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public List<ProjectMembership> Memberships { get; set; } = [];
}
