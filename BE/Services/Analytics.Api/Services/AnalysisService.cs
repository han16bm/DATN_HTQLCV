using System.Text.Json;
using Analytics.Api.Interfaces;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;

namespace Analytics.Api.Services;

/// <summary>
/// Trang tổng hợp và chi tiết phân tích (GET /analytics/summary, /analytics/details/{id}), job diễn giải
/// (POST/GET /analytics/jobs) và phản hồi (POST /analytics/details/{id}/feedback) — khớp analyticsDb của mock.
/// Diễn giải sinh theo quy tắc từ chính số liệu/căn cứ của bản chụp (chưa gọi mô hình AI ngoài), nên mọi
/// trích dẫn luôn trỏ đúng thông số/căn cứ có thật.
/// </summary>
public class AnalysisService(
    ApplicationDbContext context,
    IHttpContextAccessor http,
    IAnalyticsService analytics,
    AnalysisSnapshotStore snapshots) : IAnalysisService
{
    private const string ModelName = "Diễn giải tự động theo quy tắc";
    private static readonly JsonSerializerOptions Json = AnalysisSnapshotStore.Json;

    private string ViewerId => http.HttpContext?.GetUserId() ?? throw new UnauthorizedException("Phiên đăng nhập không hợp lệ.");

    public async Task<AnalysisSummaryDto> GetSummaryAsync(AnalyticsQuery q)
    {
        var dashboard = await analytics.GetDashboardAsync(q);
        var bottlenecks = await analytics.GetBottlenecksAsync(q);
        var overview = await context.AnalysisSnapshots.AsNoTracking().FirstAsync(s => s.Id == dashboard.OverviewRef.AnalysisId);
        var payload = Payload(overview);
        return new AnalysisSummaryDto(
            dashboard.Metadata,
            dashboard.OverviewRef,
            payload.Metrics.Select(m => new SummaryMetricDto(m.Label, m.Value, m.Unit, m.Formula)).ToList(),
            bottlenecks.Items.Select(i => new HighlightDto(i.TaskTitle,
                i.Evidence.Count > 0 ? string.Join(" ", i.Evidence) : "Công việc đang chậm ở bước hiện tại.",
                i.RevisionCount >= 3 ? "HIGH" : "MEDIUM", i.AnalysisRef)).ToList(),
            payload.SystemSummary);
    }

    public async Task<AnalysisDetailDto> GetDetailAsync(string analysisId)
    {
        var (snapshot, access) = await RequireAsync(analysisId);
        return await BuildDetailAsync(snapshot, access);
    }

    public async Task<(AnalysisJobDto Job, bool Finished)> CreateJobAsync(CreateAnalysisJobRequest request)
    {
        var mode = request.GenerationMode ?? "REUSE_OR_CREATE";
        var (snapshot, access) = await RequireAsync(request.AnalysisId);
        var latestJob = await context.AnalysisJobs.AsNoTracking().Where(j => j.AnalysisId == snapshot.Id)
            .OrderByDescending(j => j.CreatedAt).FirstOrDefaultAsync();
        if (latestJob is not null && mode == "REUSE_OR_CREATE" && latestJob.Status == "SUCCEEDED" && snapshot.ExplanationJson is not null)
            return (ToDto(latestJob), true);

        var detail = await BuildDetailAsync(snapshot, access);
        if (!detail.Generation.Allowed)
            throw new BusinessRuleException("Không thể yêu cầu diễn giải cho bản dữ liệu này.") { Code = "GENERATION_BLOCKED" };

        var now = DateTime.UtcNow;
        var job = new AnalysisJob
        {
            Id = GuidGenerator.NewId(),
            AnalysisId = snapshot.Id,
            Status = "SUCCEEDED",
            CreatedBy = ViewerId,
            CreatedAt = now,
            CompletedAt = now
        };
        // Diễn giải theo quy tắc chạy ngay trong request (vài mili giây) nên job kết thúc luôn, FE không cần poll.
        if (mode == "REGENERATE" || snapshot.ExplanationJson is null)
        {
            var tracked = await context.AnalysisSnapshots.FirstAsync(s => s.Id == snapshot.Id);
            tracked.ExplanationJson = JsonSerializer.Serialize(Explain(tracked, now), Json);
            tracked.ExplanationStatus = "READY";
            tracked.ExplanationErrorJson = null;
            tracked.ActiveJobId = null;
        }
        context.AnalysisJobs.Add(job);
        await context.SaveChangesAsync();
        return (ToDto(job), true);
    }

    public async Task<AnalysisJobDto> GetJobAsync(string jobId)
    {
        var job = await context.AnalysisJobs.AsNoTracking().FirstOrDefaultAsync(j => j.Id == jobId)
            ?? throw new NotFoundException("Không tìm thấy tiến trình.");
        await RequireAsync(job.AnalysisId);
        return ToDto(job);
    }

    public async Task<FeedbackDto> CreateFeedbackAsync(string analysisId, CreateAnalysisFeedbackRequest request)
    {
        var (snapshot, access) = await RequireAsync(analysisId);
        var detail = await BuildDetailAsync(snapshot, access);
        if (!detail.Feedback.CanSubmit)
            throw new AppException("Không được phản hồi bản phân tích này trong quyền hoặc phiên bản hiện tại.",
                detail.Freshness.Status == "OUTDATED" ? ErrorCodes.Conflict : ErrorCodes.Forbidden)
            { Code = "FEEDBACK_NOT_ALLOWED" };
        var comment = request.Comment.Trim();
        if (comment.Length == 0)
            throw new ValidationException("Vui lòng nhập thông tin bắt buộc", ["comment"]);

        var item = new AnalysisFeedback
        {
            Id = GuidGenerator.NewId(),
            AnalysisId = snapshot.Id,
            Verdict = request.Verdict,
            Comment = comment,
            ActorId = ViewerId,
            CreatedAt = DateTime.UtcNow
        };
        context.AnalysisFeedback.Add(item);
        await context.SaveChangesAsync();
        return new FeedbackDto(item.Verdict, item.Comment, await PersonAsync(item.ActorId), item.CreatedAt);
    }

    // Người xem phải có quyền phân tích ở mọi dự án trong phạm vi bản chụp (bản không gắn dự án: chỉ người xem toàn hệ thống).
    private async Task<(AnalysisSnapshot Snapshot, ProjectAccess Access)> RequireAsync(string analysisId)
    {
        var snapshot = await context.AnalysisSnapshots.AsNoTracking().FirstOrDefaultAsync(s => s.Id == analysisId)
            ?? throw new NotFoundException("Không tìm thấy bản phân tích.");
        var access = await ProjectAccess.LoadAsync(context, ViewerId);
        if ((snapshot.ProjectIds.Count == 0 && !access.ReadsEveryProject)
            || snapshot.ProjectIds.Any(p => !access.Has(p, PermissionFeatures.AnalyticsView)))
            throw new ForbiddenException("Bạn không còn quyền xem toàn bộ phạm vi của bản phân tích này.");
        if (snapshot.ExpiresAt <= DateTime.UtcNow)
            throw new AppException("Bản phân tích đã hết thời gian lưu. Mở trang tổng quan để lấy bản mới.", 100410)
            { Code = "SNAPSHOT_EXPIRED" };
        return (snapshot, access);
    }

    private async Task<AnalysisDetailDto> BuildDetailAsync(AnalysisSnapshot snapshot, ProjectAccess access)
    {
        var payload = Payload(snapshot);
        var latest = await LatestIdAsync(snapshot, payload.Subject);
        var outdated = latest != snapshot.Id;
        var scope = JsonSerializer.Deserialize<SnapshotScope>(snapshot.ScopeJson, Json)!;
        var explanation = snapshot.ExplanationJson is null ? null : JsonSerializer.Deserialize<ExplanationDto>(snapshot.ExplanationJson, Json);
        var error = snapshot.ExplanationErrorJson is null ? null : JsonSerializer.Deserialize<JobErrorDto>(snapshot.ExplanationErrorJson, Json);
        var feedback = await context.AnalysisFeedback.AsNoTracking().Where(f => f.AnalysisId == snapshot.Id)
            .OrderByDescending(f => f.CreatedAt).FirstOrDefaultAsync();
        var hasData = !(payload.Metrics.Count > 0 && payload.Metrics.All(m => m.Value is null));

        return new AnalysisDetailDto(
            new AnalysisSnapshotDto(snapshot.SnapshotId, snapshot.Id, snapshot.AnalysisType, snapshot.Title, payload.Subject,
                new AnalysisScopeDto(scope.From, scope.To), snapshot.CreatedAt, payload.Quality, payload.Metrics, payload.Context,
                payload.Series, payload.Evidence),
            new FreshnessDto(outdated ? "OUTDATED" : "CURRENT", outdated ? latest : null),
            new ExplanationStateDto(explanation is null ? (error is null ? "NOT_REQUESTED" : "FAILED") : "READY", explanation, null,
                explanation is null ? error : null),
            new GenerationPolicyDto(hasData && !outdated),
            payload.SystemSummary,
            new FeedbackStateDto(
                feedback is null ? null : new FeedbackDto(feedback.Verdict, feedback.Comment, await PersonAsync(feedback.ActorId), feedback.CreatedAt),
                !outdated && snapshot.AnalysisType == "BOTTLENECK"
                    && snapshot.ProjectIds.All(p => access.Has(p, PermissionFeatures.AlertsManage))));
    }

    // Tính lại cùng phạm vi để biết bản đang xem còn là bản mới nhất của đối tượng không (null: đối tượng không còn trong kết quả).
    private async Task<string?> LatestIdAsync(AnalysisSnapshot snapshot, AnalysisSubjectDto subject)
    {
        var query = JsonSerializer.Deserialize<SnapshotScope>(snapshot.ScopeJson, Json)!.ToQuery();
        try
        {
            switch (snapshot.AnalysisType)
            {
                case "RISK": await analytics.GetRisksAsync(query); break;
                case "WORKLOAD": await analytics.GetWorkloadAsync(query); break;
                case "BOTTLENECK": await analytics.GetBottlenecksAsync(query); break;
                default: await analytics.GetDashboardAsync(query); break;
            }
        }
        catch (ForbiddenException)
        {
            return snapshot.Id; // Không tính lại được trong quyền hiện tại: giữ nguyên bản đang xem.
        }
        return snapshots.Latest(snapshot.AnalysisType, subject);
    }

    private static SnapshotPayload Payload(AnalysisSnapshot snapshot) =>
        JsonSerializer.Deserialize<SnapshotPayload>(snapshot.PayloadJson, Json)!;

    private static ExplanationDto Explain(AnalysisSnapshot snapshot, DateTime now)
    {
        var payload = Payload(snapshot);
        var findings = new List<FindingDto>
        {
            new("finding-1", "Tình hình hiện tại",
                payload.Metrics.Count > 0
                    ? string.Join("; ", payload.Metrics.Select(m => $"{m.Label}: {AnalyticsService.FormatValue(m.Value, m.Unit)}"))
                    : payload.SystemSummary,
                payload.Metrics.Select(m => m.Id).ToList(),
                payload.Evidence.Select(e => e.Id).ToList())
        };
        var missing = payload.Metrics.Where(m => m.Value is null).ToList();
        if (missing.Count > 0)
            findings.Add(new FindingDto("finding-2", "Số liệu còn thiếu",
                $"Chưa có dữ liệu cho: {string.Join(", ", missing.Select(m => m.Label))}.", missing.Select(m => m.Id).ToList(), []));
        var recommendations = payload.Evidence.Where(e => e.Action is not null).Take(3)
            .Select((e, i) => new RecommendationDto($"recommendation-{i + 1}", "Xem thông tin liên quan", e.Label, [e.Id], e.Action))
            .ToList();
        var limitations = new List<string> { "Kết quả phân tích cần được đối chiếu với tiến độ và báo cáo thực tế." };
        if (missing.Count > 0)
            limitations.Add("Nguồn dữ liệu còn thiếu; chưa đủ căn cứ kết luận quá tải hoặc hiệu suất cá nhân.");
        return new ExplanationDto(snapshot.Id, snapshot.SnapshotId, now, ModelName, payload.SystemSummary, findings, recommendations, limitations);
    }

    private async Task<PersonRefDto> PersonAsync(string userId)
    {
        var name = await context.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.DisplayName).FirstOrDefaultAsync();
        return new PersonRefDto(userId, name ?? userId);
    }

    private static AnalysisJobDto ToDto(AnalysisJob job) => new(job.Id, job.AnalysisId, job.Status, job.CreatedAt, job.CompletedAt,
        job.Status is "QUEUED" or "RUNNING" ? 2000 : 0,
        job.ErrorJson is null ? null : JsonSerializer.Deserialize<JobErrorDto>(job.ErrorJson, Json));
}
