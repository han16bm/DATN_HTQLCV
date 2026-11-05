using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;
using Shared.Entities.Enums;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Dtos;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Services;

public class ReportService(ApplicationDbContext db, IHttpContextAccessor http) : BaseService(db, http), IReportService
{
    public async Task<ReportPreviewDto> GetPreviewAsync(ReportPreviewQuery query, string actorId)
    {
        await RequireOwnProjectAsync(query.ProjectId);
        return await BuildPreviewAsync(query.ProjectId, query.PeriodType, query.PeriodStart, actorId);
    }

    public async Task<PagedResult<ReportDto>> ListAsync(ReportQuery query)
    {
        var q = ReadableReports(await AccessAsync()).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query.ProjectId)) q = q.Where(r => r.ProjectId == query.ProjectId);
        if (!string.IsNullOrWhiteSpace(query.AuthorId)) q = q.Where(r => r.AuthorId == query.AuthorId);
        if (query.PeriodType.HasValue) q = q.Where(r => r.PeriodType == query.PeriodType);
        if (query.Status.HasValue) q = q.Where(r => r.Status == query.Status);
        if (query.From.HasValue) q = q.Where(r => r.PeriodStart >= query.From);
        if (query.To.HasValue) q = q.Where(r => r.PeriodStart <= query.To);
        q = q.OrderByDescending(r => r.PeriodStart);

        var paged = await q.ToPagedResultAsync(query);
        var items = new List<ReportDto>();
        foreach (var r in paged.Items) items.Add(await r.ToDtoAsync(Db));
        return new PagedResult<ReportDto> { Items = items, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<ReportDto> GetAsync(string reportId)
    {
        var r = await Db.Reports.AsNoTracking().FirstOrDefaultAsync(x => x.Id == reportId) ?? throw new NotFoundException("Không tìm thấy báo cáo.");
        if (!await ReadableReports(await AccessAsync()).AnyAsync(x => x.Id == reportId))
            throw new ForbiddenException("Bản nháp chỉ dành cho tác giả; bản gửi cần quyền xem trong dự án.");
        return await r.ToDtoAsync(Db);
    }

    public async Task<ReportDto> CreateDraftAsync(CreateReportDraftRequest request, string actorId)
    {
        await RequireOwnProjectAsync(request.ProjectId);
        if (request.PeriodStart > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ValidationException("Kỳ báo cáo không được ở tương lai.");

        var duplicate = await Db.Reports.AnyAsync(r =>
            r.AuthorId == actorId && r.ProjectId == request.ProjectId && r.PeriodType == request.PeriodType && r.PeriodStart == request.PeriodStart);
        if (duplicate)
            throw new BusinessRuleException("Đã có báo cáo cho cùng tác giả/dự án/loại/kỳ này.");

        var now = DateTime.UtcNow;
        var entity = new Report
        {
            Id = GuidGenerator.NewId(),
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            ProjectId = request.ProjectId,
            PeriodType = request.PeriodType,
            PeriodStart = request.PeriodStart,
            AuthorId = actorId,
            Status = ReportStatus.Draft,
            Achievements = request.Achievements ?? string.Empty,
            Blockers = request.Blockers ?? string.Empty,
            NextPlan = request.NextPlan ?? string.Empty,
            SelectedTaskIds = request.SelectedTaskIds ?? []
        };

        Db.Reports.Add(entity);
        WriteAuditLog(nameof(Report), entity.Id, actorId, "CREATE_DRAFT", null, entity);
        await Db.SaveChangesAsync();
        return await entity.ToDtoAsync(Db);
    }

    public async Task<ReportDto> UpdateDraftAsync(string reportId, UpdateReportDraftRequest request, int ifMatchVersion, string actorId)
    {
        var report = await RequireOwnDraftAsync(reportId, actorId);
        TaskService.CheckVersion(report.Version, ifMatchVersion);

        if (request.Achievements is not null) report.Achievements = request.Achievements;
        if (request.Blockers is not null) report.Blockers = request.Blockers;
        if (request.NextPlan is not null) report.NextPlan = request.NextPlan;
        if (request.SelectedTaskIds is not null) report.SelectedTaskIds = request.SelectedTaskIds;
        if (request.ZeroTimeReason is not null) report.ZeroTimeReason = request.ZeroTimeReason;

        report.Version++;
        report.UpdatedAt = DateTime.UtcNow;
        WriteAuditLog(nameof(Report), report.Id, actorId, "UPDATE_DRAFT", null, report);
        await Db.SaveChangesAsync();
        return await report.ToDtoAsync(Db);
    }

    public async Task<ReportPreviewDto> RefreshDraftAsync(string reportId, int ifMatchVersion, string actorId)
    {
        var report = await RequireOwnDraftAsync(reportId, actorId);
        TaskService.CheckVersion(report.Version, ifMatchVersion);
        return await BuildPreviewAsync(report.ProjectId, report.PeriodType, report.PeriodStart, actorId);
    }

    public async Task<ReportDto> SubmitAsync(string reportId, SubmitReportRequest request, int ifMatchVersion, string actorId)
    {
        var report = await RequireOwnDraftAsync(reportId, actorId);
        TaskService.CheckVersion(report.Version, ifMatchVersion);

        if (string.IsNullOrWhiteSpace(report.Achievements) || string.IsNullOrWhiteSpace(report.NextPlan))
            throw new ValidationException("Kết quả thực hiện và kế hoạch tiếp theo không được để trống khi gửi.");

        var preview = await BuildPreviewAsync(report.ProjectId, report.PeriodType, report.PeriodStart, actorId);
        if (preview.TotalMinutes == 0 && string.IsNullOrWhiteSpace(request.ZeroTimeReason))
            throw new ValidationException("Cần nêu lý do khi tổng giờ công bằng 0.");

        report.Status = ReportStatus.Submitted;
        report.SubmittedAt = DateTime.UtcNow;
        report.SnapshotJson = System.Text.Json.JsonSerializer.Serialize(preview);
        report.ZeroTimeReason = request.ZeroTimeReason ?? report.ZeroTimeReason;
        report.Version++;
        report.UpdatedAt = DateTime.UtcNow;

        WriteAuditLog(nameof(Report), report.Id, actorId, "SUBMIT", null, report);
        await Db.SaveChangesAsync();
        return await report.ToDtoAsync(Db);
    }

    private async Task<Report> RequireOwnDraftAsync(string reportId, string actorId)
    {
        var report = await Db.Reports.FirstOrDefaultAsync(r => r.Id == reportId) ?? throw new NotFoundException("Không tìm thấy báo cáo.");
        if (report.AuthorId != actorId) throw new ForbiddenException("Chỉ tác giả được thao tác trên báo cáo này.");
        if (report.Status != ReportStatus.Draft) throw new BusinessRuleException("Chỉ sửa được báo cáo ở trạng thái Nháp.");
        return report;
    }

    /// <summary>Tính lại tổng giờ/danh sách công việc từ nhật ký gốc tại thời điểm xem — không tin số liệu đã lưu.</summary>
    private async Task<ReportPreviewDto> BuildPreviewAsync(string projectId, PeriodType periodType, DateOnly periodStart, string? authorId)
    {
        var periodEndExclusive = periodType == PeriodType.Daily
            ? periodStart.AddDays(1)
            : periodStart.AddDays(7);

        var endUtc = periodEndExclusive.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var now = DateTime.UtcNow;
        var partial = now < endUtc;

        var logsQuery = Db.TimeLogs.AsNoTracking()
            .Where(l => l.Status == TimeLogStatus.Active && l.WorkDate >= periodStart && l.WorkDate < periodEndExclusive);
        if (authorId is not null) logsQuery = logsQuery.Where(l => l.UserId == authorId);

        var taskIdsInProject = Db.Tasks.Where(t => t.ProjectId == projectId).Select(t => t.Id);
        logsQuery = logsQuery.Where(l => taskIdsInProject.Contains(l.TaskId));

        var totalMinutes = await logsQuery.SumAsync(l => (int?)l.Minutes) ?? 0;

        var items = await logsQuery
            .GroupBy(l => l.TaskId)
            .Select(g => new { TaskId = g.Key, Minutes = g.Sum(l => l.Minutes) })
            .ToListAsync();

        var reportItems = new List<ReportItemDto>();
        foreach (var item in items)
        {
            var task = await Db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == item.TaskId);
            if (task is not null)
                reportItems.Add(new ReportItemDto(task.Id, task.Title, task.Status, item.Minutes));
        }

        return new ReportPreviewDto
        {
            ProjectId = projectId,
            PeriodType = periodType,
            PeriodStart = periodStart,
            PeriodEndExclusive = endUtc,
            DataAsOf = now,
            TotalMinutes = totalMinutes,
            Items = reportItems,
            PartialPeriod = partial
        };
    }

    // Đọc được: tác giả, hoặc bản đã gửi trong dự án người xem quản lý/xem phân tích (canRead của mock).
    private IQueryable<Report> ReadableReports(ProjectAccess access)
    {
        var uid = access.UserId;
        if (access.ReadsEveryProject)
            return Db.Reports.Where(r => r.AuthorId == uid || r.Status == ReportStatus.Submitted);
        var member = access.ProjectIds.ToList();
        var oversee = member.Where(p => access.Has(p, PermissionFeatures.ProjectManage)
            || access.Has(p, PermissionFeatures.TasksManage) || access.Has(p, PermissionFeatures.AnalyticsView)).ToList();
        return Db.Reports.Where(r => member.Contains(r.ProjectId)
            && (r.AuthorId == uid || (r.Status == ReportStatus.Submitted && oversee.Contains(r.ProjectId))));
    }

    // Báo cáo cá nhân chỉ lập trong dự án mình đang là thành viên (activeProject của mock).
    private async Task RequireOwnProjectAsync(string projectId)
    {
        var access = await AccessAsync();
        await access.EnsureAsync(Db, projectId);
        if (!access.IsMember(projectId))
            throw new ForbiddenException("Chỉ thành viên dự án được lập báo cáo cá nhân.");
    }
}
