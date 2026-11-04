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

public class ProjectMemberService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<ProjectMembership>(context, httpContextAccessor), IProjectMemberService
{
    public async Task<PagedResult<MembershipDto>> ListAsync(string projectId, MembershipQuery query)
    {
        await EnsureProjectExistsAsync(projectId);

        var members = Context.ProjectMemberships.AsNoTracking().Where(m => m.ProjectId == projectId);
        var paged = await members.OrderBy(m => m.CreatedAt).ToPagedResultAsync(query);
        var dtos = await MapManyAsync(paged.Items);
        return new PagedResult<MembershipDto> { Items = dtos, Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<MembershipDto> AddAsync(string projectId, MemberCreateRequest request)
    {
        await EnsureProjectExistsAsync(projectId);

        if (request.ProjectRole == ProjectRole.Owner)
            throw new ValidationException("OWNER chỉ được gán khi tạo hoặc đổi người phụ trách dự án.");

        var user = await Context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId)
            ?? throw new ValidationException("Tài khoản không tồn tại.");
        if (user.Status != UserStatus.Active)
            throw new BusinessRuleException("Tài khoản không ở trạng thái hoạt động.");
        if (request.ProjectRole == ProjectRole.Manager && !await PermissionEvaluator.HasPermissionAsync(Context, user, PermissionFeatures.ProjectCreate))
            throw new BusinessRuleException("Vai trò MANAGER chỉ dành cho tài khoản có quyền PROJECT_CREATE (Leader/PM).");

        var existing = await Context.ProjectMemberships
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == request.UserId && m.EndedAt == null);
        if (existing)
            throw new BusinessRuleException("Tài khoản đã là thành viên đang hoạt động của dự án.");

        var now = DateTime.UtcNow;
        var membership = new ProjectMembership
        {
            Id = GuidGenerator.NewId(),
            Version = 1,
            CreatedAt = now,
            UpdatedAt = now,
            ProjectId = projectId,
            UserId = request.UserId,
            ProjectRole = request.ProjectRole,
            EndedAt = null
        };
        Context.ProjectMemberships.Add(membership);

        await WriteAuditLogAsync(membership.Id, "ADD_MEMBER", null, Snapshot(membership));
        await Context.SaveChangesAsync();
        return (await MapManyAsync([membership]))[0];
    }

    public async Task<MembershipDto> EndAsync(string projectId, string membershipId, EndMembershipRequest request)
    {
        var membership = await FindAsync(projectId, membershipId);
        CheckIfMatch(membership.Version);

        var project = await Context.Projects.FirstAsync(p => p.Id == projectId);
        if (membership.ProjectRole == ProjectRole.Owner && project.OwnerId == membership.UserId)
            throw new BusinessRuleException("Không thể kết thúc tư cách của người phụ trách hiện tại.");

        var hasOpenWork = await Context.Tasks.AnyAsync(t => t.ProjectId == projectId && t.AssigneeId == membership.UserId
            && t.Status != WorkTaskStatus.Completed && t.Status != WorkTaskStatus.Cancelled);
        if (hasOpenWork)
            throw new BusinessRuleException("Thành viên còn công việc chưa bàn giao.");

        var before = Snapshot(membership);
        membership.EndedAt = DateTime.UtcNow;
        membership.Version++;
        membership.UpdatedAt = DateTime.UtcNow;

        await WriteAuditLogAsync(membership.Id, "END_MEMBERSHIP", before, Snapshot(membership), request.Reason);
        await Context.SaveChangesAsync();
        return (await MapManyAsync([membership]))[0];
    }

    public async Task<MembershipDto> UpdateRoleAsync(string projectId, string membershipId, MemberRoleRequest request)
    {
        var membership = await FindAsync(projectId, membershipId);
        if (membership.ProjectRole == ProjectRole.Owner)
            throw new BusinessRuleException("Không sửa OWNER bằng API này.");
        if (request.ProjectRole == ProjectRole.Owner)
            throw new ValidationException("OWNER chỉ được gán khi đổi người phụ trách dự án.");

        CheckIfMatch(membership.Version);

        if (request.ProjectRole == ProjectRole.Manager)
        {
            var user = await Context.Users.FirstOrDefaultAsync(u => u.Id == membership.UserId);
            if (user is null || !await PermissionEvaluator.HasPermissionAsync(Context, user, PermissionFeatures.ProjectCreate))
                throw new BusinessRuleException("Vai trò MANAGER chỉ dành cho tài khoản có quyền PROJECT_CREATE (Leader/PM).");
        }

        var before = Snapshot(membership);
        membership.ProjectRole = request.ProjectRole;
        membership.Version++;
        membership.UpdatedAt = DateTime.UtcNow;

        await WriteAuditLogAsync(membership.Id, "UPDATE_ROLE", before, Snapshot(membership), request.Reason);
        await Context.SaveChangesAsync();
        return (await MapManyAsync([membership]))[0];
    }

    private async Task EnsureProjectExistsAsync(string projectId)
    {
        if (!await Context.Projects.AnyAsync(p => p.Id == projectId))
            throw new NotFoundException("Không tìm thấy dự án.");
    }

    private async Task<ProjectMembership> FindAsync(string projectId, string membershipId)
    {
        return await Context.ProjectMemberships.FirstOrDefaultAsync(m => m.Id == membershipId && m.ProjectId == projectId)
            ?? throw new NotFoundException("Không tìm thấy tư cách thành viên.");
    }

    private async Task<List<MembershipDto>> MapManyAsync(List<ProjectMembership> memberships)
    {
        var userIds = memberships.Select(m => m.UserId).Distinct().ToList();
        var users = await Context.Users.AsNoTracking().Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
        var names = await AuditActorNames.LoadAsync(Context, memberships.SelectMany(m => new[] { m.CreatedBy, m.UpdatedBy }));

        return memberships.Select(m => new MembershipDto(
            m.Id, m.Version, m.UserId, m.ProjectRole.ToString().ToUpperInvariant(), m.EndedAt,
            users.TryGetValue(m.UserId, out var user) ? new PersonRefDto(user.Id, user.DisplayName) : new PersonRefDto(m.UserId, m.UserId),
            m.CreatedAt, StampRef(m.CreatedBy, names), m.UpdatedAt, StampRef(m.UpdatedBy, names)
        )).ToList();
    }

    private static object Snapshot(ProjectMembership m)
    {
        return new { m.ProjectRole, m.EndedAt };
    }
}
