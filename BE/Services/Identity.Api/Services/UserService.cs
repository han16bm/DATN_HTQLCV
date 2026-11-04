using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Extensions;
using Shared.Commons.Utils;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Identity.Api.Services;

public class UserService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    : BaseService<User>(context, httpContextAccessor), IUserService
{
    private static readonly PasswordHasher<User> Hasher = new();

    public async Task<Shared.Commons.Models.PagedResult<UserDto>> ListAsync(UserQuery query)
    {
        var q = context.Users.Include(u => u.Unit).AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Q))
            q = q.Where(u => u.DisplayName.Contains(query.Q) || u.Username.Contains(query.Q));
        if (!string.IsNullOrWhiteSpace(query.UnitId))
            q = q.Where(u => u.UnitId == query.UnitId);
        if (!string.IsNullOrWhiteSpace(query.GroupId))
            q = q.Where(u => context.PermissionGroupMembers.Any(m => m.UserId == u.Id && m.PermissionGroupId == query.GroupId));
        if (query.IsSysAdmin.HasValue)
            q = q.Where(u => u.IsSysAdmin == query.IsSysAdmin.Value);
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<UserStatus>(query.Status, true, out var status))
            q = q.Where(u => u.Status == status);

        var paged = await q.OrderByDescending(u => u.CreatedAt).ToPagedResultAsync(query);
        var groups = await LoadActiveGroupsAsync(context, paged.Items.Select(u => u.Id));
        var names = await LoadDisplayNamesAsync(paged.Items.SelectMany(u => new[] { u.CreatedBy, u.UpdatedBy }));
        return new Shared.Commons.Models.PagedResult<UserDto>
        {
            Items = paged.Items.Select(u => ToDto(u, groups, names)).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            Total = paged.Total
        };
    }

    public async Task<UserDto> GetAsync(string userId)
    {
        return await ToDtoAsync(await FindAsync(userId));
    }

    public async Task<ProfileDto> GetProfileAsync(string userId)
    {
        var user = await context.Users.Include(u => u.Unit).AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        var groups = await LoadActiveGroupsAsync(context, [user.Id]);
        return new ProfileDto(user.Id, user.DisplayName, null, user.Email, user.Unit?.Name ?? string.Empty,
            groups.GetValueOrDefault(user.Id, []).Select(g => g.Label).ToList());
    }

    public async Task<UserDto> CreateAsync(UserCreateRequest request)
    {
        if (await context.Users.AnyAsync(u => u.Username == request.Username))
            throw new BusinessRuleException("Tên đăng nhập đã tồn tại.");

        var unit = await context.Units.FindAsync(request.UnitId)
            ?? throw new NotFoundException("Không tìm thấy đơn vị.");
        if (unit.Status != OrgStatus.Active)
            throw new BusinessRuleException("Đơn vị không hoạt động.");

        var groupIds = await ValidateGroupIdsAsync(request.GroupIds, "groupIds");
        await EnsureCanGrantAsync(await GroupFeaturesAsync(groupIds));

        var user = new User
        {
            Id = GuidGenerator.NewId(),
            Username = request.Username.Trim(),
            DisplayName = request.DisplayName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            UnitId = request.UnitId,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1
        };
        user.PasswordHash = Hasher.HashPassword(user, request.InitialPassword);

        await context.Users.AddAsync(user);
        await context.PermissionGroupMembers.AddRangeAsync(groupIds.Select(id => new PermissionGroupMember { PermissionGroupId = id, UserId = user.Id }));
        await WriteAuditLog(user.Id, "CREATE", null, new { user.Username, user.DisplayName, GroupIds = groupIds });
        await context.SaveChangesAsync();

        user.Unit = unit;
        return await ToDtoAsync(user);
    }

    public async Task<UserDto> UpdateAsync(string userId, UserPatchRequest request, int ifMatchVersion)
    {
        var user = await FindAsync(userId);
        CheckVersion(user.Version, ifMatchVersion);

        var before = new { user.DisplayName, user.Email, user.UnitId };
        if (request.DisplayName is not null) user.DisplayName = request.DisplayName.Trim();
        if (request.Email is not null) user.Email = request.Email.Trim().ToLowerInvariant();
        if (request.UnitId is not null) user.UnitId = request.UnitId;

        user.UpdatedAt = DateTime.UtcNow;
        user.Version++;

        await WriteAuditLog(user.Id, "UPDATE", before, new { user.DisplayName, user.Email, user.UnitId }, request.Reason);
        await context.SaveChangesAsync();
        return await ToDtoAsync(user);
    }

    public async Task<UserDto> LockAsync(string userId, UserLockRequest request, int ifMatchVersion)
    {
        var user = await FindAsync(userId);
        CheckVersion(user.Version, ifMatchVersion);

        await EnsureNotLastSysAdminAsync(user);

        // Khóa thường yêu cầu bàn giao trước ở tầng nghiệp vụ Tasks/Projects — base này chỉ chặn khi không phải EMERGENCY và còn vai trò quản lý đơn vị.
        if (!string.Equals(request.Mode, "EMERGENCY", StringComparison.OrdinalIgnoreCase)
            && await context.Units.AnyAsync(u => u.ManagerId == userId && u.Status == OrgStatus.Active))
            throw new BusinessRuleException("Tài khoản còn phụ trách đơn vị — cần bàn giao trước khi khóa thường, hoặc dùng khóa khẩn cấp.");

        user.Status = UserStatus.Locked;
        user.LockedAt = DateTime.UtcNow;
        user.LockReason = request.Reason;
        user.UpdatedAt = DateTime.UtcNow;
        user.Version++;

        await WriteAuditLog(user.Id, "LOCK", null, new { request.Mode }, request.Reason);
        await context.SaveChangesAsync();
        return await ToDtoAsync(user);
    }

    public async Task<UserDto> UnlockAsync(string userId, ReasonRequest request, int ifMatchVersion)
    {
        var user = await FindAsync(userId);
        CheckVersion(user.Version, ifMatchVersion);

        user.Status = UserStatus.Active;
        user.LockedAt = null;
        user.LockReason = null;
        user.FailedLoginCount = 0;
        user.UpdatedAt = DateTime.UtcNow;
        user.Version++;

        await WriteAuditLog(user.Id, "UNLOCK", null, null, request.Reason);
        await context.SaveChangesAsync();
        return await ToDtoAsync(user);
    }

    public async Task ResetPasswordAsync(string userId, ResetPasswordRequest request)
    {
        var user = await FindAsync(userId);
        user.PasswordHash = Hasher.HashPassword(user, request.TemporaryPassword);
        user.UpdatedAt = DateTime.UtcNow;
        user.Version++;

        await WriteAuditLog(user.Id, "RESET_PASSWORD", null, null, request.Reason);
        await context.SaveChangesAsync();
    }

    public async Task<UserPermissionsDto> GetPermissionsAsync(string userId)
    {
        return await ToPermissionsDtoAsync(await FindAsync(userId));
    }

    public async Task<UserPermissionsDto> UpdatePermissionsAsync(string userId, UserPermissionsRequest request, int ifMatchVersion)
    {
        var user = await FindAsync(userId);
        CheckVersion(user.Version, ifMatchVersion);

        await ValidateFeatureCodesAsync(request.GrantedFeatures, "grantedFeatures");
        await ValidateFeatureCodesAsync(request.RevokedFeatures, "revokedFeatures");
        var groupIds = await ValidateGroupIdsAsync(request.GroupIds, "groupIds");

        var isSysAdmin = request.IsSysAdmin!.Value;
        if (isSysAdmin != user.IsSysAdmin)
        {
            var actor = await GetActorAsync();
            if (!actor.IsSysAdmin)
                throw new ForbiddenException("Chỉ sysadmin mới được đổi cờ sysadmin.");
            if (!isSysAdmin)
                await EnsureNotLastSysAdminAsync(user);
        }

        var memberships = await context.PermissionGroupMembers.Where(m => m.UserId == userId).ToListAsync();
        var currentGroupIds = memberships.Select(m => m.PermissionGroupId).ToList();
        var addedGroupIds = groupIds.Except(currentGroupIds).ToList();
        var removedGroupIds = currentGroupIds.Except(groupIds).ToList();

        // Chỉ kiểm tra phần được thêm mới — giữ nguyên quyền sẵn có không phải là leo thang.
        // Bỏ một quyền khỏi RevokedFeatures cũng là cấp quyền đó, nên phải kiểm tra như grant.
        var unrevoked = user.RevokedFeatures.Except(request.RevokedFeatures);
        await EnsureCanGrantAsync(request.GrantedFeatures.Except(user.GrantedFeatures).Concat(unrevoked).Concat(await GroupFeaturesAsync(addedGroupIds)));

        var before = new { user.IsSysAdmin, user.GrantedFeatures, user.RevokedFeatures, GroupIds = currentGroupIds };

        context.PermissionGroupMembers.RemoveRange(memberships.Where(m => removedGroupIds.Contains(m.PermissionGroupId)));
        await context.PermissionGroupMembers.AddRangeAsync(addedGroupIds.Select(id => new PermissionGroupMember { PermissionGroupId = id, UserId = userId }));
        var changedGroupIds = addedGroupIds.Concat(removedGroupIds).ToList();
        foreach (var group in await context.PermissionGroups.Where(g => changedGroupIds.Contains(g.Id)).ToListAsync())
        {
            group.Version++;
            group.UpdatedAt = DateTime.UtcNow;
        }

        user.IsSysAdmin = isSysAdmin;
        user.GrantedFeatures = request.GrantedFeatures.Distinct().ToList();
        user.RevokedFeatures = request.RevokedFeatures.Distinct().ToList();
        user.UpdatedAt = DateTime.UtcNow;
        user.Version++;

        await WriteAuditLog(user.Id, "UPDATE_PERMISSIONS", before,
            new { user.IsSysAdmin, user.GrantedFeatures, user.RevokedFeatures, GroupIds = groupIds }, request.Reason);
        await context.SaveChangesAsync();
        return await ToPermissionsDtoAsync(user);
    }

    /// <summary>Nhóm Active mà mỗi user thuộc — dùng cho UserDto.groups (cả AuthService dùng chung).</summary>
    public static async Task<Dictionary<string, List<RefDto>>> LoadActiveGroupsAsync(ApplicationDbContext db, IEnumerable<string> userIds)
    {
        var ids = userIds.Distinct().ToList();
        var rows = await db.PermissionGroupMembers.AsNoTracking()
            .Where(m => ids.Contains(m.UserId) && m.PermissionGroup!.Status == OrgStatus.Active)
            .Select(m => new { m.UserId, m.PermissionGroupId, m.PermissionGroup!.Name })
            .ToListAsync();
        return rows.GroupBy(r => r.UserId)
            .ToDictionary(g => g.Key, g => g.OrderBy(r => r.Name).Select(r => new RefDto(r.PermissionGroupId, r.Name)).ToList());
    }

    /// <summary>names = null → không trả dấu vết (session /auth/me, §8.3).</summary>
    public static UserDto ToDto(User u, Dictionary<string, List<RefDto>> groups, Dictionary<string, string>? names)
    {
        return new(
            u.Id, u.Version, u.CreatedAt, u.UpdatedAt, u.Username, u.DisplayName, u.Email, null, u.UnitId,
            u.IsSysAdmin, groups.GetValueOrDefault(u.Id, []), u.Status.ToString().ToUpperInvariant(),
            new EntityLabelDto(u.UnitId, u.Unit?.Name ?? string.Empty),
            names is null ? null : PersonRef(u.CreatedBy, names),
            names is null ? null : PersonRef(u.UpdatedBy, names));
    }

    private async Task<UserDto> ToDtoAsync(User u)
    {
        return ToDto(u, await LoadActiveGroupsAsync(context, [u.Id]), await LoadDisplayNamesAsync([u.CreatedBy, u.UpdatedBy]));
    }

    private async Task<UserPermissionsDto> ToPermissionsDtoAsync(User u)
    {
        var groups = await context.PermissionGroupMembers.AsNoTracking()
            .Where(m => m.UserId == u.Id)
            .OrderBy(m => m.PermissionGroup!.Name)
            .Select(m => new RefDto(m.PermissionGroupId, m.PermissionGroup!.Name))
            .ToListAsync();
        var effective = await PermissionEvaluator.GetEffectivePermissionsAsync(context, u);
        return new UserPermissionsDto(u.Id, u.Version, u.IsSysAdmin, groups, u.GrantedFeatures, u.RevokedFeatures, effective);
    }

    private async Task<List<string>> ValidateGroupIdsAsync(List<string> groupIds, string field)
    {
        var ids = groupIds.Distinct().ToList();
        var found = await context.PermissionGroups.AsNoTracking().Where(g => ids.Contains(g.Id)).Select(g => g.Id).ToListAsync();
        var missing = ids.Except(found).ToList();
        if (missing.Count > 0)
            throw new ValidationException($"Nhóm quyền không tồn tại: {string.Join(", ", missing)}.", [field]);
        return ids;
    }

    /// <summary>Luôn phải còn ít nhất 1 tài khoản Active có IsSysAdmin (§1.3).</summary>
    private async Task EnsureNotLastSysAdminAsync(User user)
    {
        if (user.IsSysAdmin && user.Status == UserStatus.Active
            && !await context.Users.AnyAsync(u => u.Id != user.Id && u.IsSysAdmin && u.Status == UserStatus.Active))
            throw new UnprocessableRuleException("Không thể khoá hoặc bỏ cờ sysadmin của tài khoản sysadmin cuối cùng.");
    }

    private async Task<User> FindAsync(string userId)
    {
        return await context.Users.Include(u => u.Unit).FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
    }
}
