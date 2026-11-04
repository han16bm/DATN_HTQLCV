using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Dtos;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Services;

public class SubmissionService(ApplicationDbContext db, IHttpContextAccessor http) : BaseService(db, http), ISubmissionService
{
    public async Task<PagedResult<SubmissionDto>> ListAsync(string taskId, SimplePagingQuery query)
    {
        await RequireTaskAsync(taskId);
        var q = Db.Submissions.AsNoTracking().Where(s => s.TaskId == taskId).OrderByDescending(s => s.Sequence);
        var paged = await q.ToPagedResultAsync(query);
        var items = new List<SubmissionDto>();
        foreach (var s in paged.Items) items.Add(await s.ToDtoAsync(Db));
        return new PagedResult<SubmissionDto> { Items = items, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<SubmissionDto> GetAsync(string taskId, string submissionId)
    {
        await RequireTaskAsync(taskId);
        var s = await Db.Submissions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == submissionId && x.TaskId == taskId)
            ?? throw new NotFoundException("Không tìm thấy lần nộp.");
        return await s.ToDtoAsync(Db);
    }

    public async Task<SubmissionMutationResult> CreateAsync(string taskId, CreateSubmissionRequest request, int ifMatchVersion, string actorId)
    {
        var task = await RequireTaskAsync(taskId);
        TaskService.CheckVersion(task.Version, ifMatchVersion);
        if (task.AssigneeId != actorId || task.Status != WorkTaskStatus.InProgress)
            throw new BusinessRuleException("Chỉ người nhận hiện tại ở Đang thực hiện được nộp kết quả.");

        var hasPending = await Db.Submissions.AnyAsync(s => s.TaskId == taskId && s.Status == SubmissionStatus.Pending);
        if (hasPending)
            throw new BusinessRuleException("Công việc đã có lần nộp đang chờ xét.");

        var hasOwnTimeLog = await Db.TimeLogs.AnyAsync(l => l.TaskId == taskId && l.UserId == actorId && l.Status == TimeLogStatus.Active);
        if (!hasOwnTimeLog)
            throw new BusinessRuleException("Cần có ít nhất một nhật ký thời gian hợp lệ của chính mình trước khi nộp.");

        if (request.Links.Count > 10 || request.AttachmentIds.Count > 10)
            throw new ValidationException("Tối đa 10 liên kết và 10 tệp minh chứng.");

        foreach (var attachmentId in request.AttachmentIds)
        {
            var att = await Db.Attachments.FirstOrDefaultAsync(a => a.Id == attachmentId && a.TaskId == taskId);
            if (att is null || att.Status != AttachmentStatus.Ready)
                throw new ValidationException("Tệp minh chứng không hợp lệ hoặc chưa sẵn sàng.");
        }

        var nextSeq = 1 + await Db.Submissions.Where(s => s.TaskId == taskId).Select(s => (int?)s.Sequence).MaxAsync() ?? 1;
        var actualMinutes = await Db.TimeLogs.Where(l => l.TaskId == taskId && l.Status == TimeLogStatus.Active).SumAsync(l => (int?)l.Minutes) ?? 0;

        var now = DateTime.UtcNow;
        var submission = new Submission
        {
            Id = GuidGenerator.NewId(),
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            TaskId = taskId,
            Sequence = nextSeq,
            SubmittedBy = actorId,
            SubmittedAt = now,
            Summary = request.Summary,
            Links = request.Links,
            AttachmentIds = request.AttachmentIds,
            DueAtSnapshot = task.DueAt,
            ActualMinutesSnapshot = actualMinutes,
            Status = SubmissionStatus.Pending
        };

        Db.Submissions.Add(submission);
        task.Status = WorkTaskStatus.PendingReview;
        task.StatusChangedAt = now;
        task.LatestSubmissionId = submission.Id;
        task.Version++;
        task.UpdatedAt = now;

        WriteAuditLog(nameof(Submission), submission.Id, actorId, "CREATE", null, new { submission.Sequence, submission.Summary, submission.Links, submission.AttachmentIds, submission.Status });
        await Db.SaveChangesAsync();

        return new SubmissionMutationResult(await submission.ToDtoAsync(Db), await task.ToDtoAsync(Db));
    }

    public async Task<SubmissionMutationResult> ApproveAsync(string taskId, string submissionId, ApproveSubmissionRequest request, int ifMatchVersion, string actorId)
    {
        var (submission, task) = await RequireLatestPendingAsync(taskId, submissionId, actorId);
        TaskService.CheckVersion(submission.Version, ifMatchVersion);

        var now = DateTime.UtcNow;
        submission.Status = SubmissionStatus.Accepted;
        submission.ReviewedBy = actorId;
        submission.ReviewedAt = now;
        submission.ReviewComment = request.Comment;
        submission.Version++;
        submission.UpdatedAt = now;

        task.Status = WorkTaskStatus.Completed;
        task.CompletedAt = now;
        task.StatusChangedAt = now;
        task.Version++;
        task.UpdatedAt = now;

        var assignment = await Db.TaskAssignments.FirstOrDefaultAsync(a => a.TaskId == taskId && a.EndedAt == null);
        if (assignment is not null) assignment.EndedAt = now;

        WriteAuditLog(nameof(Submission), submission.Id, actorId, "APPROVE", null, new { submission.Status, submission.ReviewedBy, submission.ReviewComment });
        await Db.SaveChangesAsync();

        return new SubmissionMutationResult(await submission.ToDtoAsync(Db), await task.ToDtoAsync(Db));
    }

    public async Task<SubmissionMutationResult> RequestRevisionAsync(string taskId, string submissionId, RequestSubmissionRevisionRequest request, int ifMatchVersion, string actorId)
    {
        var (submission, task) = await RequireLatestPendingAsync(taskId, submissionId, actorId);
        TaskService.CheckVersion(submission.Version, ifMatchVersion);

        var now = DateTime.UtcNow;
        submission.Status = SubmissionStatus.RevisionRequested;
        submission.ReviewedBy = actorId;
        submission.ReviewedAt = now;
        submission.ReviewComment = request.Reason;
        submission.RequestedChanges = request.RequestedChanges;
        submission.Version++;
        submission.UpdatedAt = now;

        task.Status = WorkTaskStatus.InProgress;
        task.StatusChangedAt = now;
        task.Version++;
        task.UpdatedAt = now;

        WriteAuditLog(nameof(Submission), submission.Id, actorId, "REQUEST_REVISION", null, new { submission.Status, submission.ReviewedBy, submission.ReviewComment, submission.RequestedChanges }, request.Reason);
        await Db.SaveChangesAsync();

        return new SubmissionMutationResult(await submission.ToDtoAsync(Db), await task.ToDtoAsync(Db));
    }

    public async Task<PagedResult<ReviewQueueItemDto>> ListReviewQueueAsync(ReviewQueueQuery query)
    {
        // Chỉ dự án người xét có TASKS_REVIEW; bỏ lần nộp của chính mình và lần nộp không còn mới nhất.
        var access = await AccessAsync();
        var reviewable = access.ProjectIdsWith(PermissionFeatures.TasksReview).ToList();
        var uid = access.UserId;
        var q = Db.Submissions.AsNoTracking().Where(s => s.Status == SubmissionStatus.Pending && s.SubmittedBy != uid
            && Db.Tasks.Any(t => t.Id == s.TaskId && t.LatestSubmissionId == s.Id && reviewable.Contains(t.ProjectId)));
        if (!string.IsNullOrWhiteSpace(query.ProjectId))
        {
            var taskIds = Db.Tasks.Where(t => t.ProjectId == query.ProjectId).Select(t => t.Id);
            q = q.Where(s => taskIds.Contains(s.TaskId));
        }
        q = q.OrderBy(s => s.SubmittedAt);

        var paged = await q.ToPagedResultAsync(query);
        var taskIdsInPage = paged.Items.Select(s => s.TaskId).Distinct().ToList();
        var tasks = await Db.Tasks.AsNoTracking().Where(t => taskIdsInPage.Contains(t.Id)).ToDictionaryAsync(t => t.Id);

        var items = new List<ReviewQueueItemDto>();
        foreach (var s in paged.Items)
        {
            var submitter = await Db.PersonRefAsync(s.SubmittedBy);
            var taskTitle = tasks.TryGetValue(s.TaskId, out var task) ? task.Title : s.TaskId;
            items.Add(new ReviewQueueItemDto(s.Id, s.TaskId, taskTitle, s.Sequence, submitter, s.SubmittedAt, s.DueAtSnapshot));
        }
        return new PagedResult<ReviewQueueItemDto> { Items = items, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    private async Task<(Submission Submission, WorkTask Task)> RequireLatestPendingAsync(string taskId, string submissionId, string actorId)
    {
        var task = await RequireTaskAsync(taskId, PermissionFeatures.TasksReview);
        var submission = await Db.Submissions.FirstOrDefaultAsync(s => s.Id == submissionId && s.TaskId == taskId)
            ?? throw new NotFoundException("Không tìm thấy lần nộp.");

        if (submission.Status != SubmissionStatus.Pending)
            throw new BusinessRuleException("Lần nộp đã được xét trước đó.");
        if (task.LatestSubmissionId != submission.Id)
            throw new BusinessRuleException("Chỉ lần nộp mới nhất mới được xét.");
        if (submission.SubmittedBy == actorId)
            throw new ForbiddenException("Người nộp không được tự xét kết quả của mình.");

        return (submission, task);
    }
}
