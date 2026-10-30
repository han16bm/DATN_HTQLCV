using Analytics.Api.Constants;
using Analytics.Api.Interfaces;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Analytics.Api.Services;

public class AnalyticsService(ApplicationDbContext context) : IAnalyticsService
{
    private IQueryable<WorkTask> FilterTasks(AnalyticsQuery q)
    {
        var query = context.Tasks.AsNoTracking().Include(t => t.Project).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.ProjectId)) query = query.Where(t => t.ProjectId == q.ProjectId);
        if (!string.IsNullOrWhiteSpace(q.UnitId)) query = query.Where(t => t.Project!.UnitId == q.UnitId);
        if (!string.IsNullOrWhiteSpace(q.OwnerId)) query = query.Where(t => t.Project!.OwnerId == q.OwnerId);
        if (!string.IsNullOrWhiteSpace(q.AssigneeId)) query = query.Where(t => t.AssigneeId == q.AssigneeId);
        if (q.Status.HasValue) query = query.Where(t => t.Status == q.Status);
        if (q.Priority.HasValue) query = query.Where(t => t.Priority == q.Priority);
        return query;
    }

    public async Task<DashboardDto> GetDashboardAsync(AnalyticsQuery q)
    {
        var now = DateTime.UtcNow;
        var periodStartUtc = q.From.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var periodEndExclusiveUtc = q.To.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var tasks = await FilterTasks(q).ToListAsync();
        var taskIds = tasks.Select(t => t.Id).ToList();

        // Phạm vi công việc không gắn người nhận hiện tại — dùng cho giờ công/lần nộp để không gán nhầm hoạt động
        // của người nhận trước đó cho người đang được lọc (xem METRICS_K01_K16.md ghi chú K06/K08).
        var timeScopeTaskIds = await FilterTasks(q with { AssigneeId = null }).Select(t => t.Id).ToListAsync();

        // K01: công việc không CANCELLED.
        var nonCancelled = tasks.Where(t => t.Status != WorkTaskStatus.Cancelled).ToList();
        var k01Count = nonCancelled.Count;

        var byStatus = tasks.GroupBy(t => t.Status)
            .Select(g => new StatusCountDto(g.Key.ToUpperSnake(), g.Count()))
            .OrderBy(s => s.Status)
            .ToList();

        // K02: công việc được chấp nhận hoàn thành trong kỳ (CompletedAt trong [From,To]).
        var k02Count = tasks.Count(t => t.Status == WorkTaskStatus.Completed && t.CompletedAt.HasValue
            && t.CompletedAt.Value >= periodStartUtc && t.CompletedAt.Value < periodEndExclusiveUtc);

        // K03: hoàn thành hiện tại / tổng không hủy.
        var currentCompletedCount = tasks.Count(t => t.Status == WorkTaskStatus.Completed);
        decimal? k03Rate = k01Count == 0 ? null : Math.Round((decimal)currentCompletedCount / k01Count * 100, 2);

        // K04/K05: "việc mở" = chưa Completed/Cancelled; quá hạn = DueAt < hiện tại.
        var notClosed = tasks.Where(t => t.Status != WorkTaskStatus.Completed && t.Status != WorkTaskStatus.Cancelled).ToList();
        var overdueOpenCount = notClosed.Count(t => t.DueAt < now);
        decimal? k05Rate = notClosed.Count == 0 ? null : Math.Round((decimal)overdueOpenCount / notClosed.Count * 100, 2);

        // K06/K07: giờ công gắn với TimeLog.UserId (người ghi), lọc riêng theo AssigneeId nếu có.
        var actualMinutesQueryBase = context.TimeLogs.AsNoTracking()
            .Where(l => timeScopeTaskIds.Contains(l.TaskId) && l.Status == TimeLogStatus.Active);
        if (!string.IsNullOrWhiteSpace(q.AssigneeId))
            actualMinutesQueryBase = actualMinutesQueryBase.Where(l => l.UserId == q.AssigneeId);

        var actualMinutesPeriod = await actualMinutesQueryBase
            .Where(l => l.WorkDate >= q.From && l.WorkDate <= q.To)
            .SumAsync(l => (int?)l.Minutes) ?? 0;
        var actualMinutesAllTime = await actualMinutesQueryBase.SumAsync(l => (int?)l.Minutes) ?? 0;

        var currentEstimateMinutes = tasks.Sum(t => t.EstimatedMinutes);
        var originalEstimateMinutes = tasks.Sum(t => t.OriginalEstimatedMinutes);
        var deltaCurrentMinutes = actualMinutesAllTime - currentEstimateMinutes;
        var deltaOriginalMinutes = actualMinutesAllTime - originalEstimateMinutes;

        // K08-K11: lần nộp gắn với Submission.SubmittedBy (người nộp), cùng cách lọc riêng như giờ công.
        var submissionsScopeQuery = context.Submissions.AsNoTracking().Where(s => timeScopeTaskIds.Contains(s.TaskId));
        if (!string.IsNullOrWhiteSpace(q.AssigneeId))
            submissionsScopeQuery = submissionsScopeQuery.Where(s => s.SubmittedBy == q.AssigneeId);
        var submissionsInScope = await submissionsScopeQuery.ToListAsync();

        var submissionsInPeriod = submissionsInScope
            .Where(s => s.SubmittedAt >= periodStartUtc && s.SubmittedAt < periodEndExclusiveUtc)
            .ToList();
        var onTimeCount = submissionsInPeriod.Count(s => s.SubmittedAt <= s.DueAtSnapshot);
        var lateCount = submissionsInPeriod.Count(s => s.SubmittedAt > s.DueAtSnapshot);

        var acceptedReviewedInPeriod = submissionsInScope
            .Where(s => s.Status == SubmissionStatus.Accepted && s.ReviewedAt.HasValue
                && s.ReviewedAt.Value >= periodStartUtc && s.ReviewedAt.Value < periodEndExclusiveUtc)
            .ToList();
        var k09LateAcceptanceCount = acceptedReviewedInPeriod.Count(s => s.ReviewedAt!.Value > s.DueAtSnapshot);

        var reviewedInPeriod = submissionsInScope
            .Where(s => s.ReviewedAt.HasValue && s.ReviewedAt.Value >= periodStartUtc && s.ReviewedAt.Value < periodEndExclusiveUtc)
            .ToList();
        var pendingSubmittedInPeriod = submissionsInScope
            .Where(s => s.Status == SubmissionStatus.Pending && s.SubmittedAt >= periodStartUtc && s.SubmittedAt < periodEndExclusiveUtc)
            .ToList();
        var reviewDurationsMinutes = new List<double>();
        foreach (var s in reviewedInPeriod) reviewDurationsMinutes.Add((s.ReviewedAt!.Value - s.SubmittedAt).TotalMinutes);
        foreach (var s in pendingSubmittedInPeriod) reviewDurationsMinutes.Add((now - s.SubmittedAt).TotalMinutes);
        decimal? k10AvgReviewMinutes = reviewDurationsMinutes.Count == 0 ? null : Math.Round((decimal)reviewDurationsMinutes.Average(), 2);

        var k11RevisionRequestedCount = submissionsInScope.Count(s => s.Status == SubmissionStatus.RevisionRequested
            && s.ReviewedAt.HasValue && s.ReviewedAt.Value >= periodStartUtc && s.ReviewedAt.Value < periodEndExclusiveUtc);

        // K12: công việc đang xử lý (Chờ thực hiện/Đang thực hiện).
        var k12OpenCount = tasks.Count(t => t.Status is WorkTaskStatus.Todo or WorkTaskStatus.InProgress);

        // K13/K14: cần lịch làm việc/nghỉ phép — hệ thống chưa có nguồn dữ liệu này, giữ null theo đúng quy ước
        // "thiếu nguồn → không chia/không mặc định" thay vì giả định 8 giờ/ngày.

        // K15: thời gian trung bình các việc mở đã ở nguyên trạng thái hiện tại.
        var openForK15 = notClosed;
        decimal? k15AvgMinutes = openForK15.Count == 0
            ? null
            : Math.Round((decimal)openForK15.Average(t => (now - t.StatusChangedAt).TotalMinutes), 2);

        // K16/reporting: báo cáo gắn với Report.AuthorId (tác giả), phạm vi theo dự án/đơn vị chứ không qua Task.
        var reportsQuery = context.Reports.AsNoTracking()
            .Where(r => r.Status == ReportStatus.Submitted && r.SubmittedAt.HasValue
                && r.SubmittedAt.Value >= periodStartUtc && r.SubmittedAt.Value < periodEndExclusiveUtc);
        if (!string.IsNullOrWhiteSpace(q.ProjectId))
        {
            reportsQuery = reportsQuery.Where(r => r.ProjectId == q.ProjectId);
        }
        else if (!string.IsNullOrWhiteSpace(q.UnitId))
        {
            var projectIdsInUnit = context.Projects.Where(p => p.UnitId == q.UnitId).Select(p => p.Id);
            reportsQuery = reportsQuery.Where(r => projectIdsInUnit.Contains(r.ProjectId));
        }
        if (!string.IsNullOrWhiteSpace(q.AssigneeId)) reportsQuery = reportsQuery.Where(r => r.AuthorId == q.AssigneeId);

        var reportsInScope = await reportsQuery.ToListAsync();
        var submittedDaily = reportsInScope.Count(r => r.PeriodType == PeriodType.Daily);
        var submittedWeekly = reportsInScope.Count(r => r.PeriodType == PeriodType.Weekly);

        var metrics = new List<MetricDto>
        {
            new("K01", "Tổng công việc đang theo dõi", k01Count, "TASK", "CURRENT", null, NewRef()),
            new("K02", "Công việc hoàn thành trong kỳ", k02Count, "TASK", "PERIOD", null, NewRef()),
            new("K03", "Tỷ lệ hoàn thành", k03Rate, "PERCENT", "CURRENT", k01Count, NewRef()),
            new("K04", "Công việc đang mở đã quá hạn", overdueOpenCount, "TASK", "CURRENT", null, NewRef()),
            new("K05", "Tỷ lệ quá hạn trong việc đang mở", k05Rate, "PERCENT", "CURRENT", notClosed.Count, NewRef()),
            new("K06", "Giờ công ghi nhận trong kỳ", Math.Round(actualMinutesPeriod / 60m, 2), "HOUR", "PERIOD", null, NewRef()),
            new("K07", "Chênh lệch giờ công so với ước lượng hiện tại", deltaCurrentMinutes, "MINUTE", "CURRENT", null, NewRef()),
            new("K08", "Số lần nộp trễ hạn trong kỳ", lateCount, "COUNT", "PERIOD", submissionsInPeriod.Count, NewRef()),
            new("K09", "Nghiệm thu sau hạn (kết quả đã chấp nhận)", k09LateAcceptanceCount, "COUNT", "PERIOD", acceptedReviewedInPeriod.Count, NewRef()),
            new("K10", "Thời gian chờ nghiệm thu trung bình", k10AvgReviewMinutes, "MINUTE", "PERIOD", null, NewRef()),
            new("K11", "Số lần yêu cầu sửa trong kỳ", k11RevisionRequestedCount, "COUNT", "PERIOD", null, NewRef()),
            new("K12", "Công việc đang xử lý (chờ thực hiện/đang thực hiện)", k12OpenCount, "TASK", "CURRENT", null, NewRef()),
            new("K13", "Thời gian có thể làm việc", null, "HOUR", "PERIOD", null, NewRef()),
            new("K14", "Mức độ bận so với thời gian khả dụng", null, "PERCENT", "PERIOD", null, NewRef()),
            new("K15", "Thời gian trung bình ở trạng thái hiện tại", k15AvgMinutes, "MINUTE", "CURRENT", null, NewRef()),
            new("K16", "Báo cáo đã gửi trong kỳ", submittedDaily + submittedWeekly, "REPORT", "PERIOD", null, NewRef()),
        };

        var trend = new List<TrendPointDto>();
        var maxTrendDays = 400;
        var dayCount = 0;
        for (var d = q.From; d <= q.To && dayCount < maxTrendDays; d = d.AddDays(1), dayCount++)
        {
            var completedCount = tasks.Count(t => t.Status == WorkTaskStatus.Completed && t.CompletedAt.HasValue
                && DateOnly.FromDateTime(t.CompletedAt.Value) == d);
            var submissionCount = submissionsInScope.Count(s => DateOnly.FromDateTime(s.SubmittedAt) == d);
            trend.Add(new TrendPointDto(d, completedCount, submissionCount));
        }

        var minutesByProject = await context.TimeLogs.AsNoTracking()
            .Where(l => taskIds.Contains(l.TaskId) && l.Status == TimeLogStatus.Active && l.WorkDate >= q.From && l.WorkDate <= q.To)
            .Join(context.Tasks, l => l.TaskId, t => t.Id, (l, t) => new { t.ProjectId, l.Minutes })
            .GroupBy(x => x.ProjectId)
            .Select(g => new { ProjectId = g.Key, Minutes = g.Sum(x => x.Minutes) })
            .ToDictionaryAsync(x => x.ProjectId, x => x.Minutes);

        var projectIds = tasks.Select(t => t.ProjectId).Distinct().ToList();
        var projects = await context.Projects.AsNoTracking().Where(p => projectIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
        var projectComparisons = new List<ProjectComparisonDto>();
        foreach (var projectId in projectIds)
        {
            var projectTasks = tasks.Where(t => t.ProjectId == projectId).ToList();
            var projectNonCancelled = projectTasks.Where(t => t.Status != WorkTaskStatus.Cancelled).ToList();
            var projectCompleted = projectNonCancelled.Count(t => t.Status == WorkTaskStatus.Completed);
            decimal? projectRate = projectNonCancelled.Count == 0
                ? null
                : Math.Round((decimal)projectCompleted / projectNonCancelled.Count * 100, 2);
            var projectOverdue = projectTasks.Count(t => t.Status != WorkTaskStatus.Completed && t.Status != WorkTaskStatus.Cancelled && t.DueAt < now);
            var projectName = projects.TryGetValue(projectId, out var project) ? project.Name : projectId;
            var projectMinutes = minutesByProject.TryGetValue(projectId, out var minutes) ? minutes : 0;

            projectComparisons.Add(new ProjectComparisonDto(
                projectId, projectNonCancelled.Count, projectRate, projectOverdue, NewRef(), projectName, projectMinutes));
        }

        var metadata = new AnalysisMetaDto(now, new QualityDto(k01Count == 0 ? "INSUFFICIENT" : "SUFFICIENT"));
        var timeVariance = new TimeVarianceDto(actualMinutesAllTime, currentEstimateMinutes, originalEstimateMinutes, deltaCurrentMinutes, deltaOriginalMinutes);
        var submissionTimeliness = new SubmissionTimelinessDto(onTimeCount, lateCount, submissionsInPeriod.Count);
        var reporting = new ReportingDto(submittedDaily, submittedWeekly);

        return new DashboardDto(metadata, k01Count, byStatus, metrics, timeVariance, submissionTimeliness, reporting, trend, projectComparisons, NewRef());
    }

    public async Task<RisksDto> GetRisksAsync(AnalyticsQuery q)
    {
        var now = DateTime.UtcNow;
        var atRiskCutoff = now.AddDays(Thresholds.AtRiskDays);

        var tasks = await FilterTasks(q)
            .Where(t => t.Status != WorkTaskStatus.Completed && t.Status != WorkTaskStatus.Cancelled)
            .ToListAsync();

        var assigneeIds = tasks.Where(t => t.AssigneeId != null).Select(t => t.AssigneeId!).Distinct().ToList();
        var assignees = await context.Users.AsNoTracking().Where(u => assigneeIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);

        var items = new List<RiskItemDto>();
        foreach (var t in tasks)
        {
            string category;
            var evidence = new List<string>();

            if (t.AssigneeId is null)
            {
                category = "INSUFFICIENT_DATA";
                evidence.Add("Chưa phân công người thực hiện.");
            }
            else if (t.DueAt < now)
            {
                category = "OVERDUE";
                evidence.Add($"Đã quá hạn từ {t.DueAt:yyyy-MM-dd'T'HH:mm:ss'Z'}.");
            }
            else if (t.DueAt <= atRiskCutoff)
            {
                category = "AT_RISK";
                evidence.Add($"Còn khoảng {Math.Round((t.DueAt - now).TotalHours)} giờ đến hạn.");
            }
            else
            {
                category = "NO_SIGNAL";
            }

            var assignee = t.AssigneeId is not null && assignees.TryGetValue(t.AssigneeId, out var user)
                ? new PersonRefDto(user.Id, user.DisplayName)
                : null;
            var quality = new QualityDto(category == "INSUFFICIENT_DATA" ? "PARTIAL" : "SUFFICIENT");

            items.Add(new RiskItemDto(t.Id, t.Title, assignee, category, evidence, quality, NewRef()));
        }

        var itemsByTaskId = items.ToDictionary(i => i.TaskId);
        var projectIds = tasks.Select(t => t.ProjectId).Distinct().ToList();
        var projects = await context.Projects.AsNoTracking().Where(p => projectIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        var projectSummaries = tasks.GroupBy(t => t.ProjectId).Select(g =>
        {
            var groupItems = g.Select(t => itemsByTaskId[t.Id]).ToList();
            var overdue = groupItems.Count(i => i.Category == "OVERDUE");
            var atRisk = groupItems.Count(i => i.Category == "AT_RISK");
            var insufficient = groupItems.Count(i => i.Category == "INSUFFICIENT_DATA");
            var riskLevel = overdue > 0 ? "HIGH" : atRisk > 0 ? "MEDIUM" : insufficient > 0 ? "UNKNOWN" : "LOW";
            var evidence = groupItems.SelectMany(i => i.Evidence).Take(5).ToList();
            var projectName = projects.TryGetValue(g.Key, out var project) ? project.Name : g.Key;
            return new ProjectRiskSummaryDto(projectName, riskLevel, overdue, atRisk, insufficient, evidence, NewRef());
        }).ToList();

        var metadata = new AnalysisMetaDto(now, new QualityDto(tasks.Count == 0 ? "INSUFFICIENT" : "SUFFICIENT"));
        return new RisksDto(metadata, items, projectSummaries);
    }

    public async Task<WorkloadDto> GetWorkloadAsync(AnalyticsQuery q)
    {
        var now = DateTime.UtcNow;
        var tasksQuery = FilterTasks(q);

        if (!string.IsNullOrWhiteSpace(q.TeamId))
        {
            var memberIds = await context.TeamMembers.AsNoTracking()
                .Where(m => m.TeamId == q.TeamId).Select(m => m.UserId).ToListAsync();
            tasksQuery = tasksQuery.Where(t => t.AssigneeId != null && memberIds.Contains(t.AssigneeId));
        }

        var tasks = await tasksQuery.Where(t => t.AssigneeId != null).ToListAsync();
        var assigneeIds = tasks.Select(t => t.AssigneeId!).Distinct().ToList();
        var assignees = await context.Users.AsNoTracking().Where(u => assigneeIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);

        var items = tasks.GroupBy(t => t.AssigneeId!)
            .Select(g =>
            {
                var hasAllRemaining = g.All(t => t.RemainingMinutes.HasValue);
                var person = assignees.TryGetValue(g.Key, out var user) ? new PersonRefDto(user.Id, user.DisplayName) : new PersonRefDto(g.Key, g.Key);
                return new WorkloadItemDto(
                    g.Key,
                    g.Count(t => t.Status is WorkTaskStatus.Todo or WorkTaskStatus.InProgress),
                    g.Count(t => t.Status == WorkTaskStatus.PendingReview),
                    g.Sum(t => t.OriginalEstimatedMinutes),
                    g.Sum(t => t.EstimatedMinutes),
                    hasAllRemaining ? g.Sum(t => t.RemainingMinutes!.Value) : null,
                    null, // CapacityMinutes: chưa có nguồn lịch làm việc/nghỉ phép.
                    null, // UtilizationRate: phụ thuộc CapacityMinutes, giữ null theo cùng lý do.
                    person,
                    NewRef());
            }).ToList();

        var metadata = new AnalysisMetaDto(now, new QualityDto(items.Count == 0 ? "INSUFFICIENT" : "SUFFICIENT"));
        return new WorkloadDto(metadata, items);
    }

    public async Task<BottlenecksDto> GetBottlenecksAsync(AnalyticsQuery q)
    {
        var now = DateTime.UtcNow;
        var tasks = await FilterTasks(q)
            .Where(t => t.Status == WorkTaskStatus.Todo || t.Status == WorkTaskStatus.InProgress || t.Status == WorkTaskStatus.PendingReview)
            .ToListAsync();

        var assigneeIds = tasks.Where(t => t.AssigneeId != null).Select(t => t.AssigneeId!).Distinct().ToList();
        var assignees = await context.Users.AsNoTracking().Where(u => assigneeIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);

        var items = new List<BottleneckItemDto>();
        foreach (var t in tasks)
        {
            var elapsedMinutes = (now - t.StatusChangedAt).TotalMinutes;
            var isElapsedBottleneck = t.Status switch
            {
                WorkTaskStatus.PendingReview => elapsedMinutes >= Thresholds.PendingReviewBottleneckHours * 60,
                WorkTaskStatus.InProgress => elapsedMinutes >= Thresholds.InProgressBottleneckDays * 24 * 60,
                _ => false
            };

            var revisionCount = await context.Submissions.AsNoTracking()
                .CountAsync(s => s.TaskId == t.Id && s.Status == SubmissionStatus.RevisionRequested);
            var isRevisionBottleneck = revisionCount >= Thresholds.RevisionBottleneckCount;

            if (!isElapsedBottleneck && !isRevisionBottleneck) continue;

            var evidence = new List<string>();
            if (isElapsedBottleneck) evidence.Add($"Đã ở trạng thái {t.Status.ToUpperSnake()} khoảng {Math.Round(elapsedMinutes / 60)} giờ liên tục.");
            if (isRevisionBottleneck) evidence.Add($"Đã yêu cầu sửa {revisionCount} lần.");

            var assignee = t.AssigneeId is not null && assignees.TryGetValue(t.AssigneeId, out var user)
                ? new PersonRefDto(user.Id, user.DisplayName)
                : null;

            items.Add(new BottleneckItemDto(t.Id, t.Status.ToUpperSnake(), elapsedMinutes, revisionCount, "CONTINUOUS", evidence, t.Title, assignee, NewRef()));
        }

        var metadata = new AnalysisMetaDto(now, new QualityDto(items.Count == 0 ? "INSUFFICIENT" : "SUFFICIENT"));
        return new BottlenecksDto(metadata, items);
    }

    public async Task<PagedResult<EntityLabelDto>> ListFilterOptionsAsync(FilterOptionsQuery query)
    {
        IQueryable<EntityLabelDto> source = query.Kind switch
        {
            "UNIT" => context.Units.AsNoTracking()
                .Where(u => string.IsNullOrWhiteSpace(query.Q) || u.Name.Contains(query.Q))
                .OrderBy(u => u.Name)
                .Select(u => new EntityLabelDto(u.Id, u.Name)),

            "PROJECT" => context.Projects.AsNoTracking()
                .Where(p => string.IsNullOrWhiteSpace(query.UnitId) || p.UnitId == query.UnitId)
                .Where(p => string.IsNullOrWhiteSpace(query.Q) || p.Name.Contains(query.Q) || p.Code.Contains(query.Q))
                .OrderBy(p => p.Name)
                .Select(p => new EntityLabelDto(p.Id, p.Name)),

            "TEAM" => context.Teams.AsNoTracking()
                .Where(t => string.IsNullOrWhiteSpace(query.UnitId) || t.UnitId == query.UnitId)
                .Where(t => string.IsNullOrWhiteSpace(query.Q) || t.Name.Contains(query.Q))
                .OrderBy(t => t.Name)
                .Select(t => new EntityLabelDto(t.Id, t.Name)),

            "PERSON" => BuildPersonFilterOptions(query),

            _ => throw new Shared.Commons.Exceptions.ValidationException("kind không hợp lệ.")
        };

        return await source.ToPagedResultAsync(query);
    }

    private IQueryable<EntityLabelDto> BuildPersonFilterOptions(FilterOptionsQuery query)
    {
        var users = context.Users.AsNoTracking().Where(u => u.Status == UserStatus.Active);

        if (!string.IsNullOrWhiteSpace(query.ProjectId))
        {
            var memberIds = context.ProjectMemberships
                .Where(m => m.ProjectId == query.ProjectId && m.EndedAt == null)
                .Select(m => m.UserId);
            users = users.Where(u => memberIds.Contains(u.Id));
        }
        else if (!string.IsNullOrWhiteSpace(query.TeamId))
        {
            var memberIds = context.TeamMembers.Where(m => m.TeamId == query.TeamId).Select(m => m.UserId);
            users = users.Where(u => memberIds.Contains(u.Id));
        }
        else if (!string.IsNullOrWhiteSpace(query.UnitId))
        {
            users = users.Where(u => u.UnitId == query.UnitId);
        }

        if (!string.IsNullOrWhiteSpace(query.Q)) users = users.Where(u => u.DisplayName.Contains(query.Q));

        return users.OrderBy(u => u.DisplayName).Select(u => new EntityLabelDto(u.Id, u.DisplayName));
    }

    private static AnalysisRefDto NewRef()
    {
        return new AnalysisRefDto(GuidGenerator.NewId());
    }
}
