using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Projects.Api.Interfaces;
using Projects.Api.Models.Dtos;
using Projects.Api.Models.Queries;
using Projects.Api.Models.Requests;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Auditing;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Projects.Api.Services;

public class ProjectService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<Project>(context, httpContextAccessor), IProjectService
{
    public async Task<PagedResult<ProjectDto>> ListAsync(ProjectQuery query)
    {
        var projects = Context.Projects.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Q))
            projects = projects.Where(p => p.Name.Contains(query.Q) || p.Code.Contains(query.Q));
        if (!string.IsNullOrWhiteSpace(query.UnitId))
            projects = projects.Where(p => p.UnitId == query.UnitId);
        if (query.Status is not null)
            projects = projects.Where(p => p.Status == query.Status);

        var paged = await projects.OrderByDescending(p => p.CreatedAt).ToPagedResultAsync(query);
        var dtos = await MapManyAsync(paged.Items);
        return new PagedResult<ProjectDto> { Items = dtos, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<ProjectDto> GetAsync(string projectId)
    {
        var project = await FindAsync(projectId);
        return await MapAsync(project);
    }

    public async Task<ProjectDto> CreateAsync(ProjectCreateRequest request)
    {
        if (await Context.Projects.AnyAsync(p => p.Code == request.Code))
            throw new BusinessRuleException("Mã dự án đã tồn tại.");

        var owner = await Context.Users.FirstOrDefaultAsync(u => u.Id == request.OwnerId)
            ?? throw new ValidationException("Người phụ trách không tồn tại.");
        if (owner.Status != UserStatus.Active)
            throw new BusinessRuleException("Người phụ trách không ở trạng thái hoạt động.");
        if (request.StartDate > DateOnly.FromDateTime(request.DueAt))
            throw new ValidationException("Ngày bắt đầu không được sau hạn hoàn thành.");
        if (request.DueAt <= DateTime.UtcNow)
            throw new ValidationException("Hạn hoàn thành phải ở tương lai.");

        var now = DateTime.UtcNow;
        var project = new Project
        {
            Id = GuidGenerator.NewId(),
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            Code = request.Code,
            Name = request.Name.Trim(),
            Objective = request.Objective,
            UnitId = request.UnitId,
            OwnerId = request.OwnerId,
            StartDate = request.StartDate,
            DueAt = request.DueAt,
            Status = ProjectStatus.Planned
        };
        Context.Projects.Add(project);
        Context.ProjectMemberships.Add(new ProjectMembership
        {
            Id = GuidGenerator.NewId(),
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            ProjectId = project.Id,
            UserId = project.OwnerId,
            ProjectRole = ProjectRole.Owner,
            EndedAt = null
        });

        await WriteAuditLogAsync(project.Id, "CREATE", null, Snapshot(project));
        await Context.SaveChangesAsync();
        return await MapAsync(project);
    }

    public async Task<ProjectDto> UpdateAsync(string projectId, ProjectPatchRequest request)
    {
        var project = await FindAsync(projectId);
        CheckIfMatch(project.Version);
        var before = Snapshot(project);

        if (request.DueAt is { } newDueAt)
        {
            var hasLaterTask = await Context.Tasks.AnyAsync(t => t.ProjectId == projectId && t.DueAt > newDueAt
                && t.Status != WorkTaskStatus.Completed && t.Status != WorkTaskStatus.Cancelled);
            if (hasLaterTask)
                throw new BusinessRuleException("Không thể rút hạn dự án sớm hơn hạn công việc hiện có.");
            project.DueAt = newDueAt;
        }

        if (request.OwnerId is { } newOwnerId && newOwnerId != project.OwnerId)
        {
            var newOwner = await Context.Users.FirstOrDefaultAsync(u => u.Id == newOwnerId)
                ?? throw new ValidationException("Người phụ trách mới không tồn tại.");
            if (newOwner.Status != UserStatus.Active)
                throw new BusinessRuleException("Người phụ trách mới không ở trạng thái hoạt động.");

            var oldOwnerMembership = await Context.ProjectMemberships
                .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == project.OwnerId && m.EndedAt == null);
            if (oldOwnerMembership is not null)
                oldOwnerMembership.EndedAt = DateTime.UtcNow;

            var newOwnerMembership = await Context.ProjectMemberships
                .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == newOwnerId && m.EndedAt == null);
            if (newOwnerMembership is not null)
                newOwnerMembership.ProjectRole = ProjectRole.Owner;
            else
                Context.ProjectMemberships.Add(new ProjectMembership
                {
                    Id = GuidGenerator.NewId(),
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ProjectId = projectId,
                    UserId = newOwnerId,
                    ProjectRole = ProjectRole.Owner,
                    EndedAt = null
                });

            project.OwnerId = newOwnerId;
        }

        if (request.Name is { } name) project.Name = name.Trim();
        if (request.Objective is { } objective) project.Objective = objective;
        if (request.StartDate is { } startDate) project.StartDate = startDate;

        project.Version++;
        project.UpdatedAt = DateTime.UtcNow;

        await WriteAuditLogAsync(project.Id, "UPDATE", before, Snapshot(project), request.ChangeReason);
        await Context.SaveChangesAsync();
        return await MapAsync(project);
    }

    public async Task<ProjectDto> ActivateAsync(string projectId)
    {
        var project = await FindAsync(projectId);
        CheckIfMatch(project.Version);
        if (project.Status != ProjectStatus.Planned)
            throw new BusinessRuleException("Chỉ dự án Dự kiến mới chuyển sang Đang thực hiện.");

        var before = Snapshot(project);
        project.Status = ProjectStatus.Active;
        project.Version++;
        project.UpdatedAt = DateTime.UtcNow;

        await WriteAuditLogAsync(project.Id, "ACTIVATE", before, Snapshot(project));
        await Context.SaveChangesAsync();
        return await MapAsync(project);
    }

    public async Task<ClosureChecksDto> GetClosureChecksAsync(string projectId)
    {
        await FindAsync(projectId);
        var (open, pendingReview, pendingReports) = await LoadClosureCountsAsync(projectId);
        return new ClosureChecksDto(open, pendingReview, pendingReports, open == 0 && pendingReview == 0 && pendingReports == 0);
    }

    public async Task<ProjectDto> CompleteAsync(string projectId)
    {
        var project = await FindAsync(projectId);
        CheckIfMatch(project.Version);
        if (project.Status != ProjectStatus.Active)
            throw new BusinessRuleException("Chỉ dự án Đang thực hiện mới được hoàn thành.");

        var (open, pendingReview, pendingReports) = await LoadClosureCountsAsync(projectId);
        if (open > 0 || pendingReview > 0 || pendingReports > 0)
            throw new BusinessRuleException("Dự án còn công việc mở, kết quả chờ xét hoặc báo cáo cần gửi.");

        var before = Snapshot(project);
        project.Status = ProjectStatus.Completed;
        project.CompletedAt = DateTime.UtcNow;
        project.Version++;
        project.UpdatedAt = DateTime.UtcNow;

        await WriteAuditLogAsync(project.Id, "COMPLETE", before, Snapshot(project));
        await Context.SaveChangesAsync();
        return await MapAsync(project);
    }

    public async Task<ProjectDto> CancelAsync(string projectId, CancelProjectRequest request)
    {
        var project = await FindAsync(projectId);
        CheckIfMatch(project.Version);
        if (project.Status is not (ProjectStatus.Planned or ProjectStatus.Active))
            throw new BusinessRuleException("Chỉ dự án Dự kiến hoặc Đang thực hiện mới được hủy.");

        var (open, pendingReview, pendingReports) = await LoadClosureCountsAsync(projectId);
        if (open > 0 || pendingReview > 0 || pendingReports > 0)
            throw new BusinessRuleException("Dự án còn công việc mở, kết quả chờ xét hoặc báo cáo cần gửi.");

        var before = Snapshot(project);
        project.Status = ProjectStatus.Cancelled;
        project.CancelledAt = DateTime.UtcNow;
        project.Version++;
        project.UpdatedAt = DateTime.UtcNow;

        await WriteAuditLogAsync(project.Id, "CANCEL", before, Snapshot(project), request.Reason);
        await Context.SaveChangesAsync();
        return await MapAsync(project);
    }

    public async Task<PagedResult<AuditDto>> ListHistoryAsync(string projectId, PagingQuery query)
    {
        await FindAsync(projectId);
        var logs = Context.AuditLogs.AsNoTracking()
            .Where(a => a.EntityType == nameof(Project) && a.EntityId == projectId)
            .OrderByDescending(a => a.At);

        var paged = await logs.ToPagedResultAsync(query);
        var actorIds = paged.Items.Select(a => a.ActorId).Distinct().ToList();
        var actors = await Context.Users.AsNoTracking().Where(u => actorIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
        var dtos = paged.Items.Select(a => new AuditDto(
            a.Id,
            actors.TryGetValue(a.ActorId, out var actor) ? new PersonRefDto(actor.Id, actor.DisplayName) : new PersonRefDto(a.ActorId, a.ActorId),
            a.Action, a.At, ParseJson(a.BeforeJson), ParseJson(a.AfterJson), a.Reason)).ToList();
        return new PagedResult<AuditDto> { Items = dtos, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    private static object? ParseJson(string? json)
    {
        if (json is null) return null;
        return System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(json);
    }

    private async Task<Project> FindAsync(string projectId)
    {
        return await Context.Projects.FirstOrDefaultAsync(p => p.Id == projectId)
            ?? throw new NotFoundException("Không tìm thấy dự án.");
    }

    private async Task<(int Open, int PendingReview, int PendingReports)> LoadClosureCountsAsync(string projectId)
    {
        var open = await Context.Tasks.CountAsync(t => t.ProjectId == projectId && (t.Status == WorkTaskStatus.Todo || t.Status == WorkTaskStatus.InProgress));
        var pendingReview = await Context.Tasks.CountAsync(t => t.ProjectId == projectId && t.Status == WorkTaskStatus.PendingReview);
        var pendingReports = await Context.Reports.CountAsync(r => r.ProjectId == projectId && r.Status == ReportStatus.Draft);
        return (open, pendingReview, pendingReports);
    }

    private async Task<ProjectDto> MapAsync(Project project)
    {
        return (await MapManyAsync([project]))[0];
    }

    private async Task<List<ProjectDto>> MapManyAsync(List<Project> projects)
    {
        var ownerIds = projects.Select(p => p.OwnerId).Distinct().ToList();
        var unitIds = projects.Select(p => p.UnitId).Distinct().ToList();
        var owners = await Context.Users.AsNoTracking().Where(u => ownerIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
        var units = await Context.Units.AsNoTracking().Where(u => unitIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
        var names = await AuditActorNames.LoadAsync(Context, projects.SelectMany(p => new[] { p.CreatedBy, p.UpdatedBy }));

        return projects.Select(p => new ProjectDto(
            p.Id, p.Version, p.CreatedAt, p.UpdatedAt, p.Code, p.Name, p.Objective, p.UnitId, p.OwnerId,
            p.StartDate, p.DueAt, p.Status.ToString().ToUpperInvariant(), p.CompletedAt, p.CancelledAt,
            owners.TryGetValue(p.OwnerId, out var owner) ? new PersonRefDto(owner.Id, owner.DisplayName) : new PersonRefDto(p.OwnerId, p.OwnerId),
            units.TryGetValue(p.UnitId, out var unit) ? new EntityLabelDto(unit.Id, unit.Name) : new EntityLabelDto(p.UnitId, p.UnitId),
            StampRef(p.CreatedBy, names), StampRef(p.UpdatedBy, names)
        )).ToList();
    }

    private static object Snapshot(Project p)
    {
        return new { p.Name, p.Objective, p.OwnerId, p.StartDate, p.DueAt, p.Status };
    }
}
