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

public class PermissionGroupService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<PermissionGroup>(context, httpContextAccessor), IPermissionGroupService
{
    public async Task<PagedResult<PermissionGroupDto>> ListAsync(PermissionGroupQuery query)
    {
        var q = context.PermissionGroups.Include(g => g.Members).ThenInclude(m => m.User).AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Q)) q = q.Where(g => g.Name.Contains(query.Q) || g.Code.Contains(query.Q));
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<OrgStatus>(query.Status, true, out var status))
            q = q.Where(g => g.Status == status);

        var paged = await q.OrderBy(g => g.Name).ToPagedResultAsync(query);
        var names = await LoadDisplayNamesAsync(paged.Items.SelectMany(x => new[] { x.CreatedBy, x.UpdatedBy }));
        return new PagedResult<PermissionGroupDto> { Items = paged.Items.Select(x => ToDto(x, names)).ToList(), Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<PermissionGroupDto> GetAsync(string groupId)
    {
        return await ToDtoAsync(await FindAsync(groupId));
    }

    public async Task<PermissionGroupDto> CreateAsync(PermissionGroupCreateRequest request)
    {
        await ValidateFeatureCodesAsync(request.Features, "features");
        await EnsureCanGrantAsync(request.Features);
        var memberIds = await ValidateMemberIdsAsync(request.MemberIds);
        if (await context.PermissionGroups.AnyAsync(g => g.Code == request.Code))
            throw new ValidationException("Mã nhóm quyền đã tồn tại.", ["code"]);

        var group = new PermissionGroup
        {
            Id = GuidGenerator.NewId(),
            Code = request.Code,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Status = OrgStatus.Active,
            Features = request.Features.Distinct().ToList(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1
        };
        group.Members = memberIds.Select(id => new PermissionGroupMember { PermissionGroupId = group.Id, UserId = id }).ToList();

        await context.PermissionGroups.AddAsync(group);
        await WriteAuditLog(group.Id, "CREATE", null, new { group.Code, group.Name, group.Features, MemberIds = memberIds });
        await context.SaveChangesAsync();
        return await GetAsync(group.Id);
    }

    public async Task<PermissionGroupDto> UpdateAsync(string groupId, PermissionGroupPatchRequest request, int ifMatchVersion)
    {
        var group = await FindAsync(groupId);
        CheckVersion(group.Version, ifMatchVersion);
        if (request.Features is not null)
        {
            await ValidateFeatureCodesAsync(request.Features, "features");
            await EnsureCanGrantAsync(request.Features.Except(group.Features));
        }

        var before = new { group.Name, group.Description, group.Features };
        if (request.Name is not null) group.Name = request.Name.Trim();
        if (request.Description is not null) group.Description = request.Description.Trim();
        if (request.Features is not null) group.Features = request.Features.Distinct().ToList();

        group.UpdatedAt = DateTime.UtcNow;
        group.Version++;

        await WriteAuditLog(group.Id, "UPDATE", before, new { group.Name, group.Description, group.Features }, request.Reason);
        await context.SaveChangesAsync();
        return await ToDtoAsync(group);
    }

    public async Task<PermissionGroupDto> ReplaceMembersAsync(string groupId, PermissionGroupMembersRequest request, int ifMatchVersion)
    {
        var group = await FindAsync(groupId);
        CheckVersion(group.Version, ifMatchVersion);
        var memberIds = await ValidateMemberIdsAsync(request.MemberIds);

        var before = group.Members.Select(m => m.UserId).ToList();
        // Thêm người vào nhóm = trao toàn bộ quyền của nhóm cho họ, nên cũng phải qua chống leo thang
        var added = memberIds.Except(before).ToList();
        if (added.Count > 0)
            await EnsureCanGrantAsync(group.Features);

        context.PermissionGroupMembers.RemoveRange(group.Members.Where(m => !memberIds.Contains(m.UserId)));
        await context.PermissionGroupMembers.AddRangeAsync(added.Select(id => new PermissionGroupMember { PermissionGroupId = group.Id, UserId = id }));

        group.UpdatedAt = DateTime.UtcNow;
        group.Version++;

        await WriteAuditLog(group.Id, "REPLACE_MEMBERS", before, memberIds, request.Reason);
        await context.SaveChangesAsync();
        return await GetAsync(group.Id);
    }

    public async Task<PermissionGroupDto> DeactivateAsync(string groupId, ReasonRequest request, int ifMatchVersion)
    {
        var group = await FindAsync(groupId);
        CheckVersion(group.Version, ifMatchVersion);
        if (group.IsSystem)
            throw new UnprocessableRuleException("Không thể vô hiệu hoá nhóm quyền hệ thống.");

        return await SetStatusAsync(group, OrgStatus.Inactive, "DEACTIVATE", request.Reason);
    }

    public async Task<PermissionGroupDto> ActivateAsync(string groupId, ReasonRequest request, int ifMatchVersion)
    {
        var group = await FindAsync(groupId);
        CheckVersion(group.Version, ifMatchVersion);
        await EnsureCanGrantAsync(group.Features);

        return await SetStatusAsync(group, OrgStatus.Active, "ACTIVATE", request.Reason);
    }

    private async Task<PermissionGroupDto> SetStatusAsync(PermissionGroup group, OrgStatus status, string action, string reason)
    {
        var before = new { Status = group.Status.ToString() };
        group.Status = status;
        group.UpdatedAt = DateTime.UtcNow;
        group.Version++;

        await WriteAuditLog(group.Id, action, before, new { Status = status.ToString() }, reason);
        await context.SaveChangesAsync();
        return await ToDtoAsync(group);
    }

    private async Task<List<string>> ValidateMemberIdsAsync(List<string> memberIds)
    {
        var ids = memberIds.Distinct().ToList();
        var found = await context.Users.AsNoTracking().Where(u => ids.Contains(u.Id)).Select(u => u.Id).ToListAsync();
        var missing = ids.Except(found).ToList();
        if (missing.Count > 0)
            throw new ValidationException($"Tài khoản không tồn tại: {string.Join(", ", missing)}.", ["memberIds"]);
        return ids;
    }

    private async Task<PermissionGroup> FindAsync(string groupId)
    {
        return await context.PermissionGroups.Include(g => g.Members).ThenInclude(m => m.User).FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new NotFoundException("Không tìm thấy nhóm quyền.");
    }

    private async Task<PermissionGroupDto> ToDtoAsync(PermissionGroup g)
    {
        return ToDto(g, await LoadDisplayNamesAsync([g.CreatedBy, g.UpdatedBy]));
    }

    private static PermissionGroupDto ToDto(PermissionGroup g, Dictionary<string, string> names)
    {
        return new(
            g.Id, g.Version, g.CreatedAt, g.UpdatedAt, g.Code, g.Name, g.Description, g.Features,
            g.Members.Select(m => m.UserId).ToList(),
            g.Members.Select(m => new RefDto(m.UserId, m.User?.DisplayName ?? m.UserId)).OrderBy(m => m.Label).ToList(),
            g.Status.ToString().ToUpperInvariant(), g.IsSystem,
            PersonRef(g.CreatedBy, names), PersonRef(g.UpdatedBy, names));
    }
}
