using System.Text.Json;
using Analytics.Api.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;

namespace Analytics.Api.Services;

public sealed class AnalysisJobProcessor(
    ApplicationDbContext context,
    IAnalysisExplanationGenerator generator,
    ILogger<AnalysisJobProcessor> logger)
{
    private static readonly JsonSerializerOptions Json = AnalysisSnapshotStore.Json;

    public async Task<bool> ProcessNextAsync(CancellationToken cancellationToken)
    {
        var jobId = await context.AnalysisJobs.AsNoTracking()
            .Where(job => job.Status == "QUEUED")
            .OrderBy(job => job.CreatedAt)
            .Select(job => job.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (jobId is null)
            return false;

        var claimed = await context.AnalysisJobs
            .Where(job => job.Id == jobId && job.Status == "QUEUED")
            .ExecuteUpdateAsync(update => update
                .SetProperty(job => job.Status, "RUNNING")
                .SetProperty(job => job.ErrorJson, (string?)null), cancellationToken);
        if (claimed == 0)
            return true;

        var jobEntity = await context.AnalysisJobs.FirstAsync(job => job.Id == jobId, cancellationToken);
        var snapshot = await context.AnalysisSnapshots.FirstOrDefaultAsync(
            item => item.Id == jobEntity.AnalysisId, cancellationToken);
        if (snapshot is null)
        {
            await FailAsync(jobEntity, null, new AnalysisGenerationException(
                "SNAPSHOT_EXPIRED",
                "Bản phân tích đã hết thời gian lưu. Hãy mở lại trang phân tích để lấy dữ liệu mới.",
                false), cancellationToken);
            return true;
        }

        snapshot.ExplanationStatus = "RUNNING";
        snapshot.ActiveJobId = jobEntity.Id;
        snapshot.ExplanationErrorJson = null;
        await context.SaveChangesAsync(cancellationToken);

        try
        {
            var access = await ProjectAccess.LoadAsync(context, jobEntity.CreatedBy);
            if ((snapshot.ProjectIds.Count == 0 && !access.ReadsEveryProject)
                || snapshot.ProjectIds.Any(projectId => !access.Has(projectId, PermissionFeatures.AnalyticsView)))
                throw new AnalysisGenerationException(
                    "ACCESS_REVOKED",
                    "Quyền xem dữ liệu phân tích đã bị thu hồi trước khi chạy AI.",
                    false);

            var payload = JsonSerializer.Deserialize<SnapshotPayload>(snapshot.PayloadJson, Json)
                ?? throw new AnalysisGenerationException("OUTPUT_INVALID", "Không đọc được dữ liệu phân tích.", false);
            var scope = JsonSerializer.Deserialize<SnapshotScope>(snapshot.ScopeJson, Json)
                ?? throw new AnalysisGenerationException("OUTPUT_INVALID", "Không đọc được phạm vi phân tích.", false);
            var snapshotDto = new AnalysisSnapshotDto(
                snapshot.SnapshotId,
                snapshot.Id,
                snapshot.AnalysisType,
                snapshot.Title,
                payload.Subject,
                new AnalysisScopeDto(scope.From, scope.To),
                snapshot.CreatedAt,
                payload.Quality,
                payload.Metrics,
                payload.Context,
                payload.Series,
                payload.Evidence);

            var explanation = await generator.GenerateAsync(snapshotDto, cancellationToken);
            snapshot.ExplanationJson = JsonSerializer.Serialize(explanation, Json);
            snapshot.ExplanationStatus = "READY";
            snapshot.ExplanationErrorJson = null;
            snapshot.ActiveJobId = null;
            jobEntity.Status = "SUCCEEDED";
            jobEntity.CompletedAt = DateTime.UtcNow;
            jobEntity.ErrorJson = null;
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            jobEntity.Status = "QUEUED";
            jobEntity.CompletedAt = null;
            snapshot.ExplanationStatus = "QUEUED";
            snapshot.ActiveJobId = jobEntity.Id;
            await context.SaveChangesAsync(CancellationToken.None);
            throw;
        }
        catch (AnalysisGenerationException exception)
        {
            await FailAsync(jobEntity, snapshot, exception, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unexpected failure while generating analysis for job {JobId}.", jobEntity.Id);
            await FailAsync(jobEntity, snapshot, new AnalysisGenerationException(
                "PROVIDER_UNAVAILABLE",
                "Không thể hoàn tất diễn giải AI lúc này. Vui lòng thử lại sau.",
                true,
                30), cancellationToken);
        }

        return true;
    }

    private async Task FailAsync(
        AnalysisJob job,
        AnalysisSnapshot? snapshot,
        AnalysisGenerationException exception,
        CancellationToken cancellationToken)
    {
        var error = new JobErrorDto(exception.Message, exception.Retryable, exception.RetryAfterSeconds);
        var errorJson = JsonSerializer.Serialize(error, Json);
        job.Status = "FAILED";
        job.CompletedAt = DateTime.UtcNow;
        job.ErrorJson = errorJson;
        if (snapshot is not null)
        {
            snapshot.ExplanationStatus = exception.Code == "LLM_NOT_CONFIGURED" ? "UNAVAILABLE" : "FAILED";
            snapshot.ExplanationErrorJson = errorJson;
            snapshot.ActiveJobId = null;
        }

        logger.LogWarning("Analysis job {JobId} failed with code {ErrorCode}.", job.Id, exception.Code);
        await context.SaveChangesAsync(cancellationToken);
    }
}
