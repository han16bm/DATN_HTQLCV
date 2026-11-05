using Microsoft.AspNetCore.Http;
using Shared.Commons.Models;
using Tasks.Api.Models.Dtos;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Interfaces;

public interface ITaskService
{
    Task<PagedResult<TaskDto>> ListAsync(TaskQuery query);
    Task<TaskDto> GetAsync(string taskId);
    Task<TaskDto> CreateAsync(string projectId, CreateTaskRequest request, string actorId);
    Task<TaskDto> UpdateAsync(string taskId, UpdateTaskRequest request, int ifMatchVersion, string actorId);
    Task<TaskDto> CancelAsync(string taskId, CancelTaskRequest request, int ifMatchVersion, string actorId);
    Task<TaskDto> AssignAsync(string taskId, AssignTaskRequest request, int ifMatchVersion, string actorId);
    Task<TaskDto> StartAsync(string taskId, int ifMatchVersion, string actorId);
    Task<TaskDto> PauseAsync(string taskId, PauseTaskRequest request, int ifMatchVersion, string actorId);
    Task<TaskDto> UpdateRemainingEstimateAsync(string taskId, UpdateRemainingEstimateRequest request, int ifMatchVersion, string actorId);
    Task<PagedResult<AuditDto>> ListHistoryAsync(string taskId, SimplePagingQuery query);
}

public interface ITimeLogService
{
    Task<PagedResult<TimeLogDto>> ListAsync(string taskId, SimplePagingQuery query);
    Task<TimeLogMutationResult> CreateAsync(string taskId, CreateTimeLogRequest request, int ifMatchVersion, string actorId);
    Task<TimeLogMutationResult> UpdateAsync(string timeLogId, UpdateTimeLogRequest request, int ifMatchVersion, string actorId);
    Task<TimeLogMutationResult> VoidAsync(string timeLogId, VoidTimeLogRequest request, int ifMatchVersion, string actorId);
}

public interface ISubmissionService
{
    Task<PagedResult<SubmissionDto>> ListAsync(string taskId, SimplePagingQuery query);
    Task<SubmissionDto> GetAsync(string taskId, string submissionId);
    Task<SubmissionMutationResult> CreateAsync(string taskId, CreateSubmissionRequest request, int ifMatchVersion, string actorId);
    Task<SubmissionMutationResult> ApproveAsync(string taskId, string submissionId, ApproveSubmissionRequest request, int ifMatchVersion, string actorId);
    Task<SubmissionMutationResult> RequestRevisionAsync(string taskId, string submissionId, RequestSubmissionRevisionRequest request, int ifMatchVersion, string actorId);
    Task<PagedResult<ReviewQueueItemDto>> ListReviewQueueAsync(ReviewQueueQuery query);
}

public interface IAttachmentService
{
    UploadPolicyDto GetUploadPolicy();
    Task<AttachmentDto> UploadAsync(string taskId, IFormFile file, string actorId);
    Task<AttachmentDto> GetAsync(string attachmentId, string actorId);
    Task<(Stream Content, string MimeType, string Filename)> DownloadAsync(string attachmentId, string actorId);
}

public interface IReportService
{
    Task<ReportPreviewDto> GetPreviewAsync(ReportPreviewQuery query, string actorId);
    Task<PagedResult<ReportDto>> ListAsync(ReportQuery query);
    Task<ReportDto> GetAsync(string reportId);
    Task<ReportDto> CreateDraftAsync(CreateReportDraftRequest request, string actorId);
    Task<ReportDto> UpdateDraftAsync(string reportId, UpdateReportDraftRequest request, int ifMatchVersion, string actorId);
    Task<ReportPreviewDto> RefreshDraftAsync(string reportId, int ifMatchVersion, string actorId);
    Task<ReportDto> SubmitAsync(string reportId, SubmitReportRequest request, int ifMatchVersion, string actorId);
}
