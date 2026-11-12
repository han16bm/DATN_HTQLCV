using Analytics.Api.Constants;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Microsoft.EntityFrameworkCore;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Analytics.Api.Services;

// Nội dung bản chụp cho từng analysisRef (khớp snapshotRef/taskAnalysis của mock). Giá trị theo thời gian trôi
// (tuổi trạng thái, giờ đến hạn) làm tròn theo giờ để bản chụp không đổi Id mỗi lần tải lại trang.
public partial class AnalyticsService
{
    public static readonly IReadOnlyDictionary<string, string> MetricFormulas = new Dictionary<string, string>
    {
        ["K01"] = "Số công việc được theo dõi, không tính công việc đã hủy.",
        ["K02"] = "Số công việc được nghiệm thu hoàn thành trong khoảng thời gian đã chọn.",
        ["K03"] = "Cho biết bao nhiêu phần trăm công việc đã hoàn thành, không tính công việc đã hủy.",
        ["K04"] = "Số công việc đã quá hạn nhưng chưa hoàn thành, kể cả việc đang chờ nghiệm thu.",
        ["K05"] = "Cho biết bao nhiêu phần trăm công việc chưa hoàn thành đang bị quá hạn.",
        ["K06"] = "Tổng thời gian làm việc đã ghi nhận trong khoảng thời gian đã chọn, không tính nhật ký đã loại.",
        ["K07"] = "Chênh lệch giữa thời gian làm việc thực tế và thời gian ước lượng hiện tại.",
        ["K08"] = "Số lần nộp kết quả trễ hạn trong khoảng thời gian đã chọn, theo hạn được ghi nhận ở mỗi lần nộp.",
        ["K09"] = "Số công việc được nghiệm thu sau hạn hoàn thành trong khoảng thời gian đã chọn.",
        ["K10"] = "Thời gian chờ nghiệm thu trung bình của các kết quả đã nộp trong khoảng thời gian đã chọn. Với kết quả đang chờ, thời gian được tính đến lần cập nhật số liệu gần nhất.",
        ["K11"] = "Số lần kết quả công việc được yêu cầu chỉnh sửa trong khoảng thời gian đã chọn.",
        ["K12"] = "Số công việc đang thực hiện hoặc đã được giao nhưng chưa bắt đầu.",
        ["K13"] = "Thời gian nhân sự có thể dành cho công việc, dựa trên lịch làm việc, thời gian nghỉ và các công việc khác đã có kế hoạch.",
        ["K14"] = "Mức độ bận của nhân sự so với thời gian họ có thể dành cho công việc. Trên 100% nghĩa là thời gian cần để làm xong việc vượt thời gian có thể đáp ứng.",
        ["K15"] = "Thời gian trung bình các công việc chưa hoàn thành đã ở bước xử lý hiện tại.",
        ["K16"] = "Số báo cáo ngày và báo cáo tuần đã gửi trong khoảng thời gian đã chọn."
    };

    // Chỉ số tính theo tuổi (tăng theo đồng hồ) — làm tròn theo giờ trong bản chụp.
    private static readonly HashSet<string> AgeMetrics = ["K10", "K15"];

    // Chỗ giữ tạm trong danh sách chỉ số; được thay bằng tham chiếu thật trước khi trả về.
    private static AnalysisRefDto NewRef() => new("pending");

    private async Task<List<string>> ScopeProjectIdsAsync(AnalyticsQuery q)
    {
        var projects = context.Projects.AsNoTracking().AsQueryable();
        if (_allowed is not null) projects = projects.Where(p => _allowed.Contains(p.Id));
        if (!string.IsNullOrWhiteSpace(q.ProjectId)) projects = projects.Where(p => p.Id == q.ProjectId);
        if (!string.IsNullOrWhiteSpace(q.UnitId)) projects = projects.Where(p => p.UnitId == q.UnitId);
        if (!string.IsNullOrWhiteSpace(q.OwnerId)) projects = projects.Where(p => p.OwnerId == q.OwnerId);
        return await projects.Select(p => p.Id).ToListAsync();
    }

    private static MeasureDto Measure(string id, string label, decimal? value, string unit, string formula) =>
        new($"m-{id.ToLowerInvariant()}", label, value, unit == "REPORT" ? "COUNT" : unit, formula);

    private static MeasureDto Measure(MetricDto m)
    {
        var value = m.Value;
        if (value is not null && AgeMetrics.Contains(m.Code)) value = Math.Round(value.Value / 60m) * 60m;
        return Measure(m.Code, m.Label, value, m.Unit, MetricFormulas.GetValueOrDefault(m.Code, m.Label));
    }

    public static string FormatValue(decimal? value, string unit) => value is null
        ? "chưa đủ dữ liệu"
        : unit switch
        {
            "PERCENT" => $"{value:0.##}%",
            "MINUTE" => Math.Abs(value.Value) >= 60 ? $"{value / 60m:0.#} giờ" : $"{value:0} phút",
            "HOUR" => $"{value:0.##} giờ",
            "TASK" => $"{value:0} công việc",
            _ => $"{value:0.##}"
        };

    private static DomainActionDto TaskAction(string taskId) => new("TASK_DETAIL", taskId, null, null);

    private static EvidenceDto DueEvidence(WorkTask t) =>
        new("e-task", $"Hạn hoàn thành: {t.DueAt.AddHours(7):dd/MM/yyyy HH:mm} (giờ Việt Nam)", null, TaskAction(t.Id));

    private static List<EvidenceDto> TextEvidence(IEnumerable<string> lines) =>
        lines.Select((line, i) => new EvidenceDto($"e-{i + 1}", line, null, null)).ToList();

    private static AnalysisDraft MetricDraft(MetricDto m, List<string> projects)
    {
        var measure = Measure(m);
        return new AnalysisDraft("METRIC", AnalysisSubjectDto.Metric(m.Code), m.Label, [measure], [],
            measure.Value is null ? "Chưa đủ dữ liệu để tính chỉ số." : $"{m.Label}: {FormatValue(measure.Value, measure.Unit)}.",
            projects);
    }

    private static AnalysisDraft OverviewDraft(AnalyticsQuery q, List<MetricDto> metrics, List<TrendPointDto> trend,
        List<string> projects, string summary)
    {
        var subject = string.IsNullOrWhiteSpace(q.ProjectId)
            ? AnalysisSubjectDto.Unit(string.IsNullOrWhiteSpace(q.UnitId) ? "all" : q.UnitId)
            : AnalysisSubjectDto.Project(q.ProjectId);
        var series = new List<SeriesDto>
        {
            new("s-completed", "Công việc hoàn thành theo ngày", "TASK", trend.Select(p => new SeriesPointDto(p.Date, p.CompletedCount)).ToList()),
            new("s-submissions", "Lần nộp kết quả theo ngày", "COUNT", trend.Select(p => new SeriesPointDto(p.Date, p.SubmissionCount)).ToList())
        };
        return new AnalysisDraft("SUMMARY", subject, "Tổng hợp tiến độ", metrics.Select(Measure).ToList(), [], summary, projects, series);
    }

    private static AnalysisDraft ProjectSummaryDraft(string projectId, string name, int valid, decimal? rate, int overdue, int minutes) =>
        new("SUMMARY", AnalysisSubjectDto.Project(projectId), $"Tổng hợp dự án {name}",
        [
            Measure("valid", "Công việc được theo dõi", valid, "TASK", MetricFormulas["K01"]),
            Measure("rate", "Tỷ lệ hoàn thành", rate, "PERCENT", MetricFormulas["K03"]),
            Measure("overdue", "Công việc đang quá hạn", overdue, "TASK", MetricFormulas["K04"]),
            Measure("actual", "Giờ công ghi nhận trong kỳ", minutes, "MINUTE", MetricFormulas["K06"])
        ], [],
            $"Dự án {name} có {valid} công việc được theo dõi, tỷ lệ hoàn thành {FormatValue(rate, "PERCENT")}, {overdue} việc đang quá hạn.",
            [projectId]);

    private static AnalysisDraft RiskDraft(WorkTask t, string category, List<string> evidence, DateTime now)
    {
        var hoursToDue = Math.Round((decimal)(t.DueAt - now).TotalHours);
        var summary = category switch
        {
            "OVERDUE" => $"Công việc \"{t.Title}\" đã quá hạn và chưa hoàn thành.",
            "AT_RISK" => $"Công việc \"{t.Title}\" sắp đến hạn trong {Thresholds.AtRiskDays} ngày tới.",
            "INSUFFICIENT_DATA" => $"Chưa đủ dữ liệu để đánh giá rủi ro của \"{t.Title}\": chưa phân công người thực hiện.",
            _ => $"Chưa có dấu hiệu rủi ro về hạn hoàn thành của \"{t.Title}\"."
        };
        var items = new List<EvidenceDto> { DueEvidence(t) };
        items.AddRange(TextEvidence(evidence));
        return new AnalysisDraft("RISK", AnalysisSubjectDto.Task(t.Id), $"Rủi ro trễ hạn: {t.Title}",
            [Measure("hours-to-due", "Số giờ còn đến hạn", hoursToDue, "HOUR",
                "Số giờ từ lần cập nhật số liệu đến hạn hoàn thành; số âm nghĩa là đã quá hạn.")],
            items, summary, [t.ProjectId], QualityStatus: category == "INSUFFICIENT_DATA" ? "PARTIAL" : "SUFFICIENT",
            MissingFields: category == "INSUFFICIENT_DATA" ? ["Người thực hiện"] : null);
    }

    private static AnalysisDraft ProjectRiskDraft(string projectId, string name, string level, int overdue, int atRisk,
        int insufficient, List<RiskItemDto> items)
    {
        var evidence = items.Where(i => i.Category is "OVERDUE" or "AT_RISK").Take(5)
            .Select((i, n) => new EvidenceDto($"e-{n + 1}", $"{(i.Category == "OVERDUE" ? "Quá hạn" : "Sắp đến hạn")}: {i.TaskTitle}", null, TaskAction(i.TaskId)))
            .ToList();
        var levelText = level switch { "HIGH" => "cao", "MEDIUM" => "trung bình", "LOW" => "thấp", _ => "chưa xác định" };
        return new AnalysisDraft("RISK", AnalysisSubjectDto.Project(projectId), $"Rủi ro dự án {name}",
        [
            Measure("overdue", "Công việc quá hạn", overdue, "TASK", MetricFormulas["K04"]),
            Measure("at-risk", "Công việc sắp đến hạn", atRisk, "TASK", $"Công việc còn mở có hạn trong {Thresholds.AtRiskDays} ngày tới."),
            Measure("insufficient", "Công việc thiếu dữ liệu", insufficient, "TASK", "Công việc còn mở chưa có người thực hiện.")
        ], evidence, $"Mức rủi ro của dự án {name}: {levelText} ({overdue} việc quá hạn, {atRisk} việc sắp đến hạn).", [projectId]);
    }

    private static AnalysisDraft WorkloadDraft(PersonRefDto person, List<WorkTask> tasks)
    {
        var open = tasks.Where(t => t.Status is WorkTaskStatus.Todo or WorkTaskStatus.InProgress).ToList();
        var pending = tasks.Count(t => t.Status == WorkTaskStatus.PendingReview);
        var remaining = tasks.All(t => t.RemainingMinutes.HasValue) ? tasks.Sum(t => t.RemainingMinutes!.Value) : (int?)null;
        var evidence = open.OrderBy(t => t.DueAt).Take(5)
            .Select((t, i) => new EvidenceDto($"e-{i + 1}", $"Đang xử lý: {t.Title}", null, TaskAction(t.Id))).ToList();
        return new AnalysisDraft("WORKLOAD", AnalysisSubjectDto.Person(person.Id), $"Khối lượng việc của {person.DisplayName}",
        [
            Measure("open", "Công việc đang xử lý", open.Count, "TASK", MetricFormulas["K12"]),
            Measure("pending-review", "Công việc chờ nghiệm thu", pending, "TASK", "Số công việc đã nộp kết quả và đang chờ nghiệm thu."),
            Measure("estimate", "Ước lượng hiện tại", tasks.Sum(t => t.EstimatedMinutes), "MINUTE", "Tổng thời gian ước lượng hiện tại của các công việc được giao."),
            Measure("remaining", "Thời gian còn lại", remaining, "MINUTE", "Tổng thời gian còn lại người thực hiện đã cập nhật; thiếu ở bất kỳ việc nào thì để trống."),
            Measure("capacity", "Thời gian có thể làm việc", null, "HOUR", MetricFormulas["K13"])
        ], evidence,
            $"{person.DisplayName} đang xử lý {open.Count} công việc và có {pending} công việc chờ nghiệm thu. Chưa có lịch làm việc nên chưa kết luận quá tải.",
            tasks.Select(t => t.ProjectId).Distinct().ToList());
    }

    private static AnalysisDraft BottleneckDraft(WorkTask t, double elapsedMinutes, int revisions, List<string> evidence)
    {
        var items = new List<EvidenceDto> { DueEvidence(t) };
        if (t.Status == WorkTaskStatus.PendingReview && t.LatestSubmissionId is not null)
            items.Add(new EvidenceDto("e-submission", "Lần nộp mới nhất đang chờ nghiệm thu", null,
                new DomainActionDto("SUBMISSION_REVIEW", t.Id, t.LatestSubmissionId, null)));
        items.AddRange(TextEvidence(evidence));
        return new AnalysisDraft("BOTTLENECK", AnalysisSubjectDto.Task(t.Id), $"Điểm nghẽn: {t.Title}",
        [
            Measure("elapsed", "Thời gian ở trạng thái hiện tại", Math.Round((decimal)elapsedMinutes / 60m), "HOUR",
                "Thời gian liên tục kể từ lần đổi trạng thái gần nhất, làm tròn theo giờ."),
            Measure("revisions", "Số lần yêu cầu sửa", revisions, "COUNT", "Số lần kết quả công việc bị yêu cầu chỉnh sửa.")
        ], items, string.Join(" ", evidence.DefaultIfEmpty($"Công việc \"{t.Title}\" đang chậm ở bước hiện tại.")), [t.ProjectId]);
    }
}
