namespace Shared.Entities.Entities;

/// <summary>
/// Bản chụp số liệu của một tham chiếu phân tích (analysisRef trên dashboard/rủi ro/khối lượng/điểm nghẽn).
/// Id tất định = băm(loại, đối tượng, phạm vi, nội dung): cùng số liệu dùng lại cùng bản, số liệu đổi sinh bản mới
/// — nhờ vậy trang chi tiết biết bản đang xem còn CURRENT hay đã OUTDATED.
/// </summary>
public class AnalysisSnapshot
{
    public string Id { get; set; } = null!;
    public string SnapshotId { get; set; } = null!;
    public string AnalysisType { get; set; } = null!; // RISK | WORKLOAD | BOTTLENECK | SUMMARY | METRIC
    public string SubjectKind { get; set; } = null!; // TASK | PROJECT | PERSON | PROCESS | UNIT | METRIC
    public string SubjectId { get; set; } = null!;
    public string Title { get; set; } = null!;
    /// <summary>AnalyticsQuery đã chuẩn hoá (JSON) để tính lại khi kiểm độ mới.</summary>
    public string ScopeJson { get; set; } = null!;
    /// <summary>metrics/context/series/evidence/quality/systemSummary (JSON camelCase như DTO).</summary>
    public string PayloadJson { get; set; } = null!;
    /// <summary>Dự án nằm trong phạm vi bản chụp: người xem phải có quyền phân tích ở tất cả.</summary>
    public List<string> ProjectIds { get; set; } = [];
    public string CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }

    public string ExplanationStatus { get; set; } = "NOT_REQUESTED";
    public string? ExplanationJson { get; set; }
    public string? ExplanationErrorJson { get; set; }
    public string? ActiveJobId { get; set; }
}

public class AnalysisJob
{
    public string Id { get; set; } = null!;
    public string AnalysisId { get; set; } = null!;
    public string Status { get; set; } = null!; // QUEUED | RUNNING | SUCCEEDED | FAILED
    public string CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorJson { get; set; }
}

public class AnalysisFeedback
{
    public string Id { get; set; } = null!;
    public string AnalysisId { get; set; } = null!;
    public string Verdict { get; set; } = null!; // CONFIRMED | REJECTED
    public string Comment { get; set; } = null!;
    public string ActorId { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
