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

/// <summary>Trang tổng hợp, snapshot phân tích, job diễn giải AI và phản hồi quản lý.</summary>
public class AnalysisService(
    ApplicationDbContext context,
    IHttpContextAccessor http,
    IAnalyticsService analytics,
    AnalysisSnapshotStore snapshots,
    IConfiguration configuration) : IAnalysisService
{
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
        var latestJob = await context.AnalysisJobs.AsNoTracking().Where(job => job.AnalysisId == snapshot.Id)
            .OrderByDescending(job => job.CreatedAt).FirstOrDefaultAsync();
        if (latestJob is not null && latestJob.Status is "QUEUED" or "RUNNING")
            return (ToDto(latestJob), false);
        if (latestJob is not null && mode == "REUSE_OR_CREATE"
            && latestJob.Status == "SUCCEEDED" && HasLlmExplanation(snapshot))
            return (ToDto(latestJob), true);

        var detail = await BuildDetailAsync(snapshot, access);
        if (!detail.Generation.Allowed)
            throw new BusinessRuleException("Không thể yêu cầu diễn giải cho bản dữ liệu này.") { Code = "GENERATION_BLOCKED" };

        var job = new AnalysisJob
        {
            Id = GuidGenerator.NewId(),
            AnalysisId = snapshot.Id,
            Status = "QUEUED",
            CreatedBy = ViewerId,
            CreatedAt = DateTime.UtcNow
        };

        var strategy = context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var activeJob = await context.AnalysisJobs.AsNoTracking()
                    .Where(item => item.AnalysisId == snapshot.Id && (item.Status == "QUEUED" || item.Status == "RUNNING"))
                    .OrderByDescending(item => item.CreatedAt)
                    .FirstOrDefaultAsync();
                if (activeJob is not null)
                {
                    await transaction.CommitAsync();
                    return (ToDto(activeJob), false);
                }

                if (mode == "REUSE_OR_CREATE")
                {
                    var successfulJob = await context.AnalysisJobs.AsNoTracking()
                        .Where(item => item.AnalysisId == snapshot.Id && item.Status == "SUCCEEDED")
                        .OrderByDescending(item => item.CreatedAt)
                        .FirstOrDefaultAsync();
                    if (successfulJob is not null && HasLlmExplanation(snapshot))
                    {
                        await transaction.CommitAsync();
                        return (ToDto(successfulJob), true);
                    }
                }

                var reserved = await context.AnalysisSnapshots
                    .Where(item => item.Id == snapshot.Id && item.ExplanationStatus != "QUEUED" && item.ExplanationStatus != "RUNNING")
                    .ExecuteUpdateAsync(update => update
                        .SetProperty(item => item.ExplanationStatus, "QUEUED")
                        .SetProperty(item => item.ExplanationErrorJson, (string?)null)
                        .SetProperty(item => item.ActiveJobId, job.Id));
                if (reserved == 0)
                {
                    var inProgress = await context.AnalysisJobs.AsNoTracking()
                        .Where(item => item.AnalysisId == snapshot.Id && (item.Status == "QUEUED" || item.Status == "RUNNING"))
                        .OrderByDescending(item => item.CreatedAt)
                        .FirstOrDefaultAsync();
                    if (inProgress is not null)
                    {
                        await transaction.CommitAsync();
                        return (ToDto(inProgress), false);
                    }

                    throw new BusinessRuleException("Không thể tạo tiến trình cho bản phân tích hiện tại.")
                        { Code = "GENERATION_CONFLICT" };
                }

                context.AnalysisJobs.Add(job);
                await context.SaveChangesAsync();
                await transaction.CommitAsync();
                return (ToDto(job), false);
            }
            catch
            {
                context.Entry(job).State = EntityState.Detached;
                throw;
            }
        });
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

    // Mỗi người một đánh giá cho mỗi lời diễn giải (khóa theo thời điểm sinh); gửi lại thì đổi ý.
    public async Task<ExplanationRatingDto> RateExplanationAsync(string analysisId, RateExplanationRequest request)
    {
        var (snapshot, _) = await RequireAsync(analysisId);
        var explanation = LlmExplanation(snapshot)
            ?? throw new AppException("Bản phân tích chưa có lời diễn giải AI để đánh giá.", ErrorCodes.Conflict)
            { Code = "RATING_NOT_ALLOWED" };
        var viewerId = ViewerId;
        var generatedAt = RatingKey(explanation.GeneratedAt);
        var now = DateTime.UtcNow;
        var item = await context.AnalysisExplanationRatings.FirstOrDefaultAsync(r =>
            r.AnalysisId == snapshot.Id && r.ActorId == viewerId && r.ExplanationGeneratedAt == generatedAt);
        if (item is null)
        {
            item = new AnalysisExplanationRating
            {
                Id = GuidGenerator.NewId(),
                AnalysisId = snapshot.Id,
                AnalysisType = snapshot.AnalysisType,
                ExplanationGeneratedAt = generatedAt,
                ModelDisplayName = explanation.ModelDisplayName,
                PromptVersion = explanation.PromptVersion,
                ActorId = viewerId,
                CreatedAt = now
            };
            context.AnalysisExplanationRatings.Add(item);
        }

        item.Helpful = request.Helpful!.Value;
        item.UpdatedAt = now;
        await context.SaveChangesAsync();
        return new ExplanationRatingDto(item.Helpful, item.UpdatedAt);
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
        var explanation = snapshot.ExplanationJson is null
            ? null
            : JsonSerializer.Deserialize<ExplanationDto>(snapshot.ExplanationJson, Json);
        var isLegacyExplanation = explanation?.ModelDisplayName == "Diễn giải tự động theo quy tắc";
        if (isLegacyExplanation)
            explanation = null;
        var error = snapshot.ExplanationErrorJson is null || isLegacyExplanation
            ? null
            : JsonSerializer.Deserialize<JobErrorDto>(snapshot.ExplanationErrorJson, Json);
        var feedback = await context.AnalysisFeedback.AsNoTracking().Where(f => f.AnalysisId == snapshot.Id)
            .OrderByDescending(f => f.CreatedAt).FirstOrDefaultAsync();
        var hasData = !(payload.Metrics.Count > 0 && payload.Metrics.All(m => m.Value is null));
        var generation = await GenerationPolicyAsync(snapshot, outdated, hasData, error);
        bool? myRating = null;
        if (explanation is not null)
        {
            var viewerId = ViewerId;
            var generatedAt = RatingKey(explanation.GeneratedAt);
            myRating = await context.AnalysisExplanationRatings.AsNoTracking()
                .Where(r => r.AnalysisId == snapshot.Id && r.ActorId == viewerId && r.ExplanationGeneratedAt == generatedAt)
                .Select(r => (bool?)r.Helpful)
                .FirstOrDefaultAsync();
        }

        return new AnalysisDetailDto(
            new AnalysisSnapshotDto(snapshot.SnapshotId, snapshot.Id, snapshot.AnalysisType, snapshot.Title, payload.Subject,
                new AnalysisScopeDto(scope.From, scope.To), snapshot.CreatedAt, payload.Quality, payload.Metrics, payload.Context,
                payload.Series, payload.Evidence, snapshot.ExpiresAt),
            new FreshnessDto(outdated ? "OUTDATED" : "CURRENT", outdated ? latest : null),
            new ExplanationStateDto(
                isLegacyExplanation ? "NOT_REQUESTED" : snapshot.ExplanationStatus,
                explanation,
                snapshot.ActiveJobId,
                error),
            generation,
            payload.SystemSummary,
            new FeedbackStateDto(
                feedback is null ? null : new FeedbackDto(feedback.Verdict, feedback.Comment, await PersonAsync(feedback.ActorId), feedback.CreatedAt),
                !outdated && snapshot.AnalysisType == "BOTTLENECK"
                    && snapshot.ProjectIds.All(p => access.Has(p, PermissionFeatures.AlertsManage))),
            new ExplanationRatingStateDto(myRating, explanation is not null));
    }

    // Thứ tự ưu tiên lý do chặn: bản cũ → thiếu dữ liệu → đang chạy → chưa cấu hình LLM → còn trong thời gian chờ sau 429.
    private async Task<GenerationPolicyDto> GenerationPolicyAsync(
        AnalysisSnapshot snapshot, bool outdated, bool hasData, JobErrorDto? error)
    {
        if (outdated)
            return new GenerationPolicyDto(false, "SNAPSHOT_OUTDATED", null);
        if (!hasData)
            return new GenerationPolicyDto(false, "INSUFFICIENT_DATA", null);
        if (snapshot.ExplanationStatus is "QUEUED" or "RUNNING")
            return new GenerationPolicyDto(false, "ACTIVE_JOB", null);
        if (!AnalysisExplanationGenerator.IsConfigured(configuration))
            return new GenerationPolicyDto(false, "LLM_NOT_CONFIGURED", null);
        if (error is { Code: "PROVIDER_RATE_LIMIT", RetryAfterSeconds: > 0 })
        {
            var failedAt = await context.AnalysisJobs.AsNoTracking()
                .Where(job => job.AnalysisId == snapshot.Id && job.Status == "FAILED")
                .OrderByDescending(job => job.CompletedAt)
                .Select(job => job.CompletedAt)
                .FirstOrDefaultAsync();
            var wait = failedAt is null
                ? 0
                : (int)Math.Ceiling((failedAt.Value.AddSeconds(error.RetryAfterSeconds!.Value) - DateTime.UtcNow).TotalSeconds);
            if (wait > 0)
                return new GenerationPolicyDto(false, "RATE_LIMITED", wait);
        }
        return new GenerationPolicyDto(true, null, null);
    }

    // Tính lại cùng phạm vi để biết bản đang xem còn là bản mới nhất của đối tượng không (null: đối tượng không còn trong kết quả).
    private async Task<string?> LatestIdAsync(AnalysisSnapshot snapshot, AnalysisSubjectDto subject)
    {
        var scope = JsonSerializer.Deserialize<SnapshotScope>(snapshot.ScopeJson, Json)!;
        var payload = Payload(snapshot);
        var hasTimeDependentMetrics = payload.Metrics.Any(metric =>
            metric.Id is "m-k10" or "m-k15");
        var timeDependent = snapshot.AnalysisType is "RISK" or "BOTTLENECK" or "SUMMARY"
            || snapshot.AnalysisType == "METRIC" && hasTimeDependentMetrics
            || scope.TeamId is not null;
        var sourceChanged = await SourceChangedSinceAsync(snapshot.ProjectIds, snapshot.CreatedAt, scope.TeamId);
        if (!timeDependent && !sourceChanged)
            return snapshot.Id;
        var query = scope.ToQuery();
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

    private async Task<bool> SourceChangedSinceAsync(List<string> projectIds, DateTime since, string? teamId)
    {
        var all = projectIds.Count == 0;
        var tasks = context.Tasks.AsNoTracking().Where(t => all || projectIds.Contains(t.ProjectId));
        var taskIds = tasks.Select(t => t.Id);
        var projects = context.Projects.AsNoTracking().Where(project => all || projectIds.Contains(project.Id));
        var ownerIds = projects.Select(project => project.OwnerId);
        var assigneeIds = tasks.Where(task => task.AssigneeId != null).Select(task => task.AssigneeId!);
        var memberIds = context.ProjectMemberships.AsNoTracking()
            .Where(member => all || projectIds.Contains(member.ProjectId))
            .Select(member => member.UserId);
        var affectedUserIds = ownerIds.Concat(assigneeIds).Concat(memberIds).Distinct();
        var unitIds = projects.Select(project => project.UnitId);
        return await tasks.AnyAsync(t => t.UpdatedAt > since)
            || await context.Submissions.AsNoTracking().AnyAsync(s => taskIds.Contains(s.TaskId) && s.UpdatedAt > since)
            || await context.TimeLogs.AsNoTracking().AnyAsync(l => taskIds.Contains(l.TaskId) && l.UpdatedAt > since)
            || await context.Reports.AsNoTracking().AnyAsync(r => (all || projectIds.Contains(r.ProjectId)) && r.UpdatedAt > since)
            || await context.ProjectMemberships.AsNoTracking().AnyAsync(m => (all || projectIds.Contains(m.ProjectId)) && m.UpdatedAt > since)
            || await projects.AnyAsync(project => project.UpdatedAt > since)
            || await context.Users.AsNoTracking().AnyAsync(user => affectedUserIds.Contains(user.Id) && user.UpdatedAt > since)
            || await context.Units.AsNoTracking().AnyAsync(unit => unitIds.Contains(unit.Id) && unit.UpdatedAt > since)
            || teamId is not null && await context.Teams.AsNoTracking()
                .AnyAsync(team => team.Id == teamId && team.UpdatedAt > since);
    }

    private static SnapshotPayload Payload(AnalysisSnapshot snapshot) =>
        JsonSerializer.Deserialize<SnapshotPayload>(snapshot.PayloadJson, Json)!;

    private static ExplanationDto? LlmExplanation(AnalysisSnapshot snapshot)
    {
        if (snapshot.ExplanationJson is null)
            return null;
        var explanation = JsonSerializer.Deserialize<ExplanationDto>(snapshot.ExplanationJson, Json);
        return explanation?.ModelDisplayName == "Diễn giải tự động theo quy tắc" ? null : explanation;
    }

    // PostgreSQL lưu timestamp tới micro giây: cắt cùng độ chính xác để tra lại đúng bản ghi.
    private static DateTime RatingKey(DateTime generatedAt)
    {
        var utc = generatedAt.ToUniversalTime();
        return new DateTime(utc.Ticks - utc.Ticks % 10, DateTimeKind.Utc);
    }

    private static bool HasLlmExplanation(AnalysisSnapshot snapshot)
    {
        return snapshot.ExplanationJson is not null
            && JsonSerializer.Deserialize<ExplanationDto>(snapshot.ExplanationJson, Json)?.ModelDisplayName
                != "Diễn giải tự động theo quy tắc";
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
