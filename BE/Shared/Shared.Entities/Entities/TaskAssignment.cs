namespace Shared.Entities.Entities;

/// <summary>Lịch sử phân công/bàn giao của một task — mỗi task chỉ một bản ghi EndedAt=null tại một thời điểm.</summary>
public class TaskAssignment
{
    public string Id { get; set; } = null!;
    public string TaskId { get; set; } = null!;
    public string AssigneeId { get; set; } = null!;
    public string AssignedBy { get; set; } = null!;
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string? Reason { get; set; }

    public WorkTask? Task { get; set; }
}
