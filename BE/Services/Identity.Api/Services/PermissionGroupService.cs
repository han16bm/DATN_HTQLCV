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
        var q = context.PermissionGroups.Include(g => g.Members).AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Q)) q = q.Where(g => g.Name.Contains(query.Q));

        var paged = await q.OrderBy(g => g.Name).ToPagedResultAsync(query);
        return new PagedResult<PermissionGroupDto> { Items = paged.Items.Select(ToDto).ToList(), Page = paged.Page, PageSize = paged.PageSize, Total = paged.Total };
    }

    public async Task<PermissionGroupDto> GetAsync(string groupId)
    {
        return ToDto(await FindAsync(groupId));
    }

    public async Task<PermissionGroupDto> CreateAsync(PermissionGroupCreateRequest request)
    {
        ValidateFeatures(request.Features);

        var group = new PermissionGroup
        {
            Id = GuidGenerator.NewId(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Status = OrgStatus.Active,
            Features = request.Features.Distinct().ToList(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1
        };
        group.Members = request.MemberIds.Distinct().Select(id => new PermissionGroupMember { PermissionGroupId = group.Id, UserId = id }).ToList();

        await context.PermissionGroups.AddAsync(group);
        await WriteAuditLog(group.Id, "CREATE", null, new { group.Name, group.Features, request.MemberIds });
        await context.SaveChangesAsync();
        return ToDto(group);
    }

    public async Task<PermissionGroupDto> UpdateAsync(string groupId, PermissionGroupPatchRequest request, int ifMatchVersion)
    {
        var group = await FindAsync(groupId);
        CheckVersion(group.Version, ifMatchVersion);
        if (request.Features is not null) ValidateFeatures(request.Features);

        var before = new { group.Name, group.Description, group.Features };
        if (request.Name is not null) group.Name = request.Name.Trim();
        if (request.Description is not null) group.Description = request.Description.Trim();
        if (request.Features is not null) group.Features = request.Features.Distinct().ToList();

        group.UpdatedAt = DateTime.UtcNow;
        group.Version++;

        await WriteAuditLog(group.Id, "UPDATE", before, new { group.Name, group.Description, group.Features }, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(group);
    }

    public async Task<PermissionGroupDto> ReplaceMembersAsync(string groupId, PermissionGroupMembersRequest request, int ifMatchVersion)
    {
        var group = await FindAsync(groupId);
        CheckVersion(group.Version, ifMatchVersion);

        var before = group.Members.Select(m => m.UserId).ToList();
        context.PermissionGroupMembers.RemoveRange(group.Members);
        group.Members = request.MemberIds.Distinct().Select(id => new PermissionGroupMember { PermissionGroupId = group.Id, UserId = id }).ToList();

        group.UpdatedAt = DateTime.UtcNow;
        group.Version++;

        await WriteAuditLog(group.Id, "REPLACE_MEMBERS", before, request.MemberIds, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(group);
    }

    public async Task<PermissionGroupDto> DeactivateAsync(string groupId, ReasonRequest request, int ifMatchVersion)
    {
        var group = await FindAsync(groupId);
        CheckVersion(group.Version, ifMatchVersion);

        group.Status = OrgStatus.Inactive;
        group.UpdatedAt = DateTime.UtcNow;
        group.Version++;

        await WriteAuditLog(group.Id, "DEACTIVATE", null, null, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(group);
    }

    private async Task<PermissionGroup> FindAsync(string groupId)
    {
        return await context.PermissionGroups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == groupId)
            ?? throw new NotFoundException("Không tìm thấy nhóm quyền.");
    }

    private static void ValidateFeatures(List<string> features)
    {
        var invalid = features.Except(PermissionFeatures.All).ToList();
        if (invalid.Count > 0)
            throw new ValidationException($"Mã quyền không hợp lệ: {string.Join(", ", invalid)}.");
    }

    private static void CheckVersion(int current, int ifMatch)
    {
        if (ifMatch <= 0) throw new PreconditionRequiredException("Thiếu If-Match.");
        if (current != ifMatch) throw new PreconditionFailedException("Dữ liệu đã bị thay đổi bởi người khác.");
    }

    private static PermissionGroupDto ToDto(PermissionGroup g)
    {
        return new(
            g.Id, g.Version, g.CreatedAt, g.UpdatedAt, g.Name, g.Description, g.Features,
            g.Members.Select(m => m.UserId).ToList(), g.Status.ToString().ToUpperInvariant());
    }
}
