using Analytics.Api.Constants;
using Analytics.Api.Interfaces;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Extensions;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Analytics.Api.Services;

public class AlertGenerationService(ApplicationDbContext context) : IAlertGenerationService
{
    private const string MethodVersion = "alert-job-v1";

    public async Task GenerateAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var atRiskCutoff = now.AddDays(Thresholds.AtRiskDays);

        var tasks = await context.Tasks.AsNoTracking()
            .Where(t => t.Status != WorkTaskStatus.Completed && t.Status != WorkTaskStatus.Cancelled)
            .ToListAsync(cancellationToken);

        var active = new Dictionary<(string TaskId, AlertType Type), ActiveCondition>();

        foreach (var task in tasks)
        {
            if (task.AssigneeId is null)
            {
                active[(task.Id, AlertType.DataQuality)] = new ActiveCondition(
                    AlertSeverity.Low, ["Chưa phân công người thực hiện."]);
            }
            else if (task.DueAt < now)
            {
                active[(task.Id, AlertType.Overdue)] = new ActiveCondition(
                    AlertSeverity.High, [$"Đã quá hạn từ {task.DueAt:yyyy-MM-dd'T'HH:mm:ss'Z'}."]);
            }
            else if (task.DueAt <= atRiskCutoff)
            {
                var hoursLeft = Math.Round((task.DueAt - now).TotalHours);
                active[(task.Id, AlertType.DeadlineRisk)] = new ActiveCondition(
                    AlertSeverity.Medium, [$"Còn khoảng {hoursLeft} giờ đến hạn."]);
            }
        }

        var bottleneckCandidates = tasks
            .Where(t => t.Status == WorkTaskStatus.Todo || t.Status == WorkTaskStatus.InProgress || t.Status == WorkTaskStatus.PendingReview)
            .ToList();

        foreach (var task in bottleneckCandidates)
        {
            var elapsedMinutes = (now - task.StatusChangedAt).TotalMinutes;
            var isElapsedBottleneck = task.Status switch
            {
                WorkTaskStatus.PendingReview => elapsedMinutes >= Thresholds.PendingReviewBottleneckHours * 60,
                WorkTaskStatus.InProgress => elapsedMinutes >= Thresholds.InProgressBottleneckDays * 24 * 60,
                _ => false
            };

            var revisionCount = await context.Submissions.AsNoTracking()
                .CountAsync(s => s.TaskId == task.Id && s.Status == SubmissionStatus.RevisionRequested, cancellationToken);
            var isRevisionBottleneck = revisionCount >= Thresholds.RevisionBottleneckCount;

            if (!isElapsedBottleneck && !isRevisionBottleneck)
            {
                continue;
            }

            var evidence = new List<string>();
            if (isElapsedBottleneck)
            {
                evidence.Add($"Đã ở trạng thái {task.Status.ToUpperSnake()} khoảng {Math.Round(elapsedMinutes / 60)} giờ liên tục.");
            }
            if (isRevisionBottleneck)
            {
                evidence.Add($"Đã yêu cầu sửa {revisionCount} lần.");
            }

            active[(task.Id, AlertType.Bottleneck)] = new ActiveCondition(AlertSeverity.Medium, evidence);
        }

        await SyncAlertsAsync(active, now, cancellationToken);
    }

    private async Task SyncAlertsAsync(
        Dictionary<(string TaskId, AlertType Type), ActiveCondition> active,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var openAlerts = await context.Alerts
            .Where(a => a.Status != AlertStatus.Resolved && a.Status != AlertStatus.Dismissed)
            .ToListAsync(cancellationToken);

        foreach (var alert in openAlerts)
        {
            if (alert.TaskId is null)
            {
                continue;
            }
            var stillActive = active.ContainsKey((alert.TaskId, alert.Type));
            if (!stillActive && alert.ConditionActive)
            {
                alert.ConditionActive = false;
                alert.UpdatedAt = now;
                alert.Version++;
            }
        }

        var taskIdsNeedingProject = active.Keys
            .Select(k => k.TaskId)
            .Where(taskId => !openAlerts.Any(a => a.TaskId == taskId))
            .Distinct()
            .ToList();
        var projectIdsByTask = await context.Tasks.AsNoTracking()
            .Where(t => taskIdsNeedingProject.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, t => t.ProjectId, cancellationToken);

        foreach (var entry in active)
        {
            var taskId = entry.Key.TaskId;
            var type = entry.Key.Type;
            var condition = entry.Value;

            var existing = openAlerts.FirstOrDefault(a => a.TaskId == taskId && a.Type == type);
            if (existing is not null)
            {
                existing.ConditionActive = true;
                existing.Evidence = condition.Evidence;
                existing.Severity = condition.Severity;
                existing.DataAsOf = now;
                existing.UpdatedAt = now;
                existing.Version++;
                continue;
            }

            if (!projectIdsByTask.TryGetValue(taskId, out var projectId))
            {
                continue;
            }

            context.Alerts.Add(new Alert
            {
                Id = GuidGenerator.NewId(),
                Version = 1,
                CreatedAt = now,
                UpdatedAt = now,
                ProjectId = projectId,
                TaskId = taskId,
                Type = type,
                Severity = condition.Severity,
                Status = AlertStatus.Unread,
                ConditionActive = true,
                Evidence = condition.Evidence,
                DataAsOf = now,
                MethodVersion = MethodVersion
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private record ActiveCondition(AlertSeverity Severity, List<string> Evidence);
}
