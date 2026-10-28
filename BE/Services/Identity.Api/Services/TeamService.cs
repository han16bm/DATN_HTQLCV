using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Models;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Identity.Api.Services;

public class TeamService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<Team>(context, httpContextAccessor), ITeamService
{
    public async Task<PagedResult<TeamDto>> ListAsync(TeamQuery query)
    {
        var q = context.Teams.Include(t => t.Members).AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Q)) q = q.Where(t => t.Name.Contains(query.Q));
        if (!string.IsNullOrWhiteSpace(query.UnitId)) q = q.Where(t => t.UnitId == query.UnitId);

        var paged = await q.OrderBy(t => t.Name).ToPagedResultAsync(query);
        return new PagedResult<TeamDto> { Items = paged.Items.Select(ToDto).ToList(), Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<TeamDto> GetAsync(string teamId)
    {
        return ToDto(await FindAsync(teamId));
    }

    public async Task<TeamDto> CreateAsync(TeamCreateRequest request)
    {
        if (!await context.Units.AnyAsync(u => u.Id == request.UnitId))
            throw new NotFoundException("Không tìm thấy đơn vị.");

        var team = new Team
        {
            Id = GuidGenerator.NewId(),
            Name = request.Name.Trim(),
            UnitId = request.UnitId,
            Status = OrgStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1
        };
        team.Members = request.MemberIds.Distinct().Select(id => new TeamMember { TeamId = team.Id, UserId = id }).ToList();

        await context.Teams.AddAsync(team);
        await WriteAuditLog(team.Id, "CREATE", null, new { team.Name, request.MemberIds });
        await context.SaveChangesAsync();
        return ToDto(team);
    }

    public async Task<TeamDto> UpdateAsync(string teamId, TeamPatchRequest request, int ifMatchVersion)
    {
        var team = await FindAsync(teamId);
        CheckVersion(team.Version, ifMatchVersion);

        var before = new { team.Name, team.UnitId };
        if (request.Name is not null) team.Name = request.Name.Trim();
        if (request.UnitId is not null) team.UnitId = request.UnitId;

        team.UpdatedAt = DateTime.UtcNow;
        team.Version++;

        await WriteAuditLog(team.Id, "UPDATE", before, new { team.Name, team.UnitId }, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(team);
    }

    public async Task<TeamDto> ReplaceMembersAsync(string teamId, TeamMembersRequest request, int ifMatchVersion)
    {
        var team = await FindAsync(teamId);
        CheckVersion(team.Version, ifMatchVersion);

        var before = team.Members.Select(m => m.UserId).ToList();
        context.TeamMembers.RemoveRange(team.Members);
        team.Members = request.MemberIds.Distinct().Select(id => new TeamMember { TeamId = team.Id, UserId = id }).ToList();

        team.UpdatedAt = DateTime.UtcNow;
        team.Version++;

        await WriteAuditLog(team.Id, "REPLACE_MEMBERS", before, request.MemberIds, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(team);
    }

    public async Task<TeamDto> DeactivateAsync(string teamId, ReasonRequest request, int ifMatchVersion)
    {
        var team = await FindAsync(teamId);
        CheckVersion(team.Version, ifMatchVersion);

        team.Status = OrgStatus.Inactive;
        team.UpdatedAt = DateTime.UtcNow;
        team.Version++;

        await WriteAuditLog(team.Id, "DEACTIVATE", null, null, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(team);
    }

    private async Task<Team> FindAsync(string teamId)
    {
        return await context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId)
            ?? throw new NotFoundException("Không tìm thấy nhóm.");
    }

    private static void CheckVersion(int current, int ifMatch)
    {
        if (ifMatch <= 0) throw new PreconditionRequiredException("Thiếu If-Match.");
        if (current != ifMatch) throw new PreconditionFailedException("Dữ liệu đã bị thay đổi bởi người khác.");
    }

    private static TeamDto ToDto(Team t)
    {
        return new(
            t.Id, t.Version, t.CreatedAt, t.UpdatedAt, t.Name, t.UnitId,
            t.Members.Select(m => m.UserId).ToList(), t.Status.ToString().ToUpperInvariant());
    }
}
