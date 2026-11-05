namespace Shared.Entities.Entities;

public class AuditLog
{
    public string Id { get; set; } = null!;
    public string EntityType { get; set; } = null!;
    public string EntityId { get; set; } = null!;
    public string ActorId { get; set; } = null!;
    public string Action { get; set; } = null!;
    public DateTime At { get; set; }
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public string? Reason { get; set; }
}
