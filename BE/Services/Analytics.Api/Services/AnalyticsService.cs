using Analytics.Api.Constants;
using Analytics.Api.Interfaces;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Microsoft.EntityFrameworkCore;
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
        var tasks = await FilterTasks(q).ToListAsync();
        var now = DateTime.UtcNow;

        var total = tasks.Count(t => t.Status != WorkTaskStatus.Cancelled);
        var completed = tasks.Count(t => t.Status == WorkTaskStatus.Completed);
        var cancelled = tasks.Count(t => t.Status == WorkTaskStatus.Cancelled);
        var open = tasks.Count(t => t.Status is WorkTaskStatus.New or WorkTaskStatus.Todo or WorkTaskStatus.InProgress);
        var overdue = tasks.Count(t => t.DueAt < now && t.Status is not (WorkTaskStatus.Completed or WorkTaskStatus.Cancelled));
        decimal? completionRate = total == 0 ? null : Math.Round((decimal)completed / total * 100, 2);

        var taskIds = tasks.Select(t => t.Id).ToList();
        var actualMinutes = await context.TimeLogs.AsNoTracking()
            .Where(l => taskIds.Contains(l.TaskId) && l.Status == TimeLogStatus.Active && l.WorkDate >= q.From && l.WorkDate <= q.To)
            .SumAsync(l => (int?)l.Minutes) ?? 0;

        var byStatus = tasks.GroupBy(t => t.Status)
            .Select(g => new StatusCountDto { Status = g.Key.ToUpperSnake(), Count = g.Count() })
            .ToList();

        var scoped = !string.IsNullOrWhiteSpace(q.ProjectId) || !string.IsNullOrWhiteSpace(q.UnitId);

        return new DashboardDto
        {
            Quality = new QualityDto { Status = total == 0 ? "INSUFFICIENT" : "SUFFICIENT", ScopeLimited = !scoped },
            TotalTasks = total,
            CompletedTasks = completed,
            CancelledTasks = cancelled,
            OpenTasks = open,
            OverdueTasks = overdue,
            CompletionRate = completionRate,
            ActualMinutes = actualMinutes,
            ByStatus = byStatus
        };
    }

    public async Task<List<RiskItemDto>> GetRisksAsync(AnalyticsQuery q)
    {
        var tasks = await FilterTasks(q)
            .Where(t => t.Status != WorkTaskStatus.Completed && t.Status != WorkTaskStatus.Cancelled)
            .ToListAsync();
        var now = DateTime.UtcNow;
        var atRiskCutoff = now.AddDays(Thresholds.AtRiskDays);

        return tasks.Select(t =>
        {
            var (category, level) = t.DueAt < now
                ? ("OVERDUE", "HIGH")
                : t.DueAt <= atRiskCutoff
                    ? ("AT_RISK", "MEDIUM")
                    : ("NO_SIGNAL", "LOW");

            return new RiskItemDto
            {
                TaskId = t.Id,
                TaskTitle = t.Title,
                Status = t.Status.ToUpperSnake(),
                AssigneeId = t.AssigneeId,
                DueAt = t.DueAt,
                Category = category,
                RiskLevel = level,
                Quality = new QualityDto()
            };
        }).ToList();
    }

    public async Task<List<WorkloadItemDto>> GetWorkloadAsync(AnalyticsQuery q)
    {
        var tasksQuery = FilterTasks(q);

        if (!string.IsNullOrWhiteSpace(q.TeamId))
        {
            var memberIds = await context.TeamMembers.AsNoTracking()
                .Where(m => m.TeamId == q.TeamId).Select(m => m.UserId).ToListAsync();
            tasksQuery = tasksQuery.Where(t => t.AssigneeId != null && memberIds.Contains(t.AssigneeId));
        }

        var tasks = await tasksQuery.Where(t => t.AssigneeId != null).ToListAsync();

        return tasks.GroupBy(t => t.AssigneeId!)
            .Select(g =>
            {
                var hasAllRemaining = g.All(t => t.RemainingMinutes.HasValue);
                return new WorkloadItemDto
                {
                    UserId = g.Key,
                    OpenTaskCount = g.Count(t => t.Status is WorkTaskStatus.Todo or WorkTaskStatus.InProgress),
                    PendingReviewCount = g.Count(t => t.Status == WorkTaskStatus.PendingReview),
                    OriginalEstimateMinutes = g.Sum(t => t.OriginalEstimatedMinutes),
                    CurrentEstimateMinutes = g.Sum(t => t.EstimatedMinutes),
                    RemainingMinutes = hasAllRemaining ? g.Sum(t => t.RemainingMinutes!.Value) : null,
                    CapacityMinutes = null,
                    UtilizationRate = null,
                    Quality = new QualityDto
                    {
                        Status = hasAllRemaining ? "SUFFICIENT" : "PARTIAL",
                        MissingFields = hasAllRemaining ? [] : ["remainingMinutes"]
                    }
                };
            }).ToList();
    }

    public async Task<List<BottleneckItemDto>> GetBottlenecksAsync(AnalyticsQuery q)
    {
        var tasks = await FilterTasks(q)
            .Where(t => t.Status == WorkTaskStatus.Todo || t.Status == WorkTaskStatus.InProgress || t.Status == WorkTaskStatus.PendingReview)
            .ToListAsync();
        var now = DateTime.UtcNow;
        var result = new List<BottleneckItemDto>();

        foreach (var t in tasks)
        {
            var elapsedMinutes = (now - t.StatusChangedAt).TotalMinutes;
            var isBottleneck = t.Status switch
            {
                WorkTaskStatus.PendingReview => elapsedMinutes >= Thresholds.PendingReviewBottleneckHours * 60,
                WorkTaskStatus.InProgress => elapsedMinutes >= Thresholds.InProgressBottleneckDays * 24 * 60,
                _ => false
            };
            if (!isBottleneck) continue;

            var revisionCount = await context.Submissions.AsNoTracking()
                .CountAsync(s => s.TaskId == t.Id && s.Status == SubmissionStatus.RevisionRequested);

            result.Add(new BottleneckItemDto
            {
                TaskId = t.Id,
                TaskTitle = t.Title,
                Stage = t.Status.ToUpperSnake(),
                ElapsedMinutes = elapsedMinutes,
                RevisionCount = revisionCount,
                CalendarBasis = "CONTINUOUS"
            });
        }

        return result;
    }
}
