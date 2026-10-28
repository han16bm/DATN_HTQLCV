using Shared.Entities.Enums;

namespace Shared.Entities.Entities;

public class Report
{
    public string Id { get; set; } = null!;
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string ProjectId { get; set; } = null!;
    public PeriodType PeriodType { get; set; }
    public DateOnly PeriodStart { get; set; }
    public string AuthorId { get; set; } = null!;
    public ReportStatus Status { get; set; }

    public string Achievements { get; set; } = string.Empty;
    public string Blockers { get; set; } = string.Empty;
    public string NextPlan { get; set; } = string.Empty;
    public List<string> SelectedTaskIds { get; set; } = [];
    public string? ZeroTimeReason { get; set; }

    public DateTime? SubmittedAt { get; set; }

    /// <summary>Chốt số liệu từ nhật ký gốc tại lúc gửi — bất biến sau khi Submitted, không tính lại từ dữ liệu hiện tại.</summary>
    public string? SnapshotJson { get; set; }
}
