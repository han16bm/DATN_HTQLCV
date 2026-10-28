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
        if (!string.IsNullOrWhiteSpace(query.SystemRole) && Enum.TryParse<SystemRole>(query.SystemRole, true, out var role))
            q = q.Where(u => u.SystemRole == role);
        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<UserStatus>(query.Status, true, out var status))
            q = q.Where(u => u.Status == status);

        var paged = await q.OrderByDescending(u => u.CreatedAt).ToPagedResultAsync(query);
        return new Shared.Commons.Models.PagedResult<UserDto>
        {
            Items = paged.Items.Select(ToDto).ToList(),
            Page = paged.Page,
            PageSize = paged.PageSize,
            Total = paged.Total
        };
    }

    public async Task<UserDto> GetAsync(string userId)
    {
        return ToDto(await FindAsync(userId));
    }

    public async Task<UserDto> CreateAsync(UserCreateRequest request)
    {
        if (await context.Users.AnyAsync(u => u.Username == request.Username))
            throw new BusinessRuleException("Tên đăng nhập đã tồn tại.");

        var unit = await context.Units.FindAsync(request.UnitId)
            ?? throw new NotFoundException("Không tìm thấy đơn vị.");
        if (unit.Status != OrgStatus.Active)
            throw new BusinessRuleException("Đơn vị không hoạt động.");

        if (!Enum.TryParse<SystemRole>(request.SystemRole, true, out var role))
            throw new ValidationException("systemRole không hợp lệ.");

        var user = new User
        {
            Id = GuidGenerator.NewId(),
            Username = request.Username.Trim(),
            DisplayName = request.DisplayName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            UnitId = request.UnitId,
            SystemRole = role,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1
        };
        user.PasswordHash = Hasher.HashPassword(user, request.InitialPassword);

        await context.Users.AddAsync(user);
        await WriteAuditLog(user.Id, "CREATE", null, new { user.Username, user.DisplayName });
        await context.SaveChangesAsync();

        user.Unit = unit;
        return ToDto(user);
    }

    public async Task<UserDto> UpdateAsync(string userId, UserPatchRequest request, int ifMatchVersion)
    {
        var user = await FindAsync(userId);
        CheckVersion(user.Version, ifMatchVersion);

        if (request.SystemRole is not null)
        {
            var actingUserId = httpContextAccessor.HttpContext!.GetUserId();
            if (actingUserId == userId)
                throw new ForbiddenException("Không thể tự nâng quyền cho chính mình.");
            if (!Enum.TryParse<SystemRole>(request.SystemRole, true, out var role))
                throw new ValidationException("systemRole không hợp lệ.");
            user.SystemRole = role;
        }

        var before = new { user.DisplayName, user.Email, user.UnitId };
        if (request.DisplayName is not null) user.DisplayName = request.DisplayName.Trim();
        if (request.Email is not null) user.Email = request.Email.Trim().ToLowerInvariant();
        if (request.UnitId is not null) user.UnitId = request.UnitId;

        user.UpdatedAt = DateTime.UtcNow;
        user.Version++;

        await WriteAuditLog(user.Id, "UPDATE", before, new { user.DisplayName, user.Email, user.UnitId }, request.Reason);
        await context.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<UserDto> LockAsync(string userId, UserLockRequest request, int ifMatchVersion)
    {
        var user = await FindAsync(userId);
        CheckVersion(user.Version, ifMatchVersion);

        if (user.SystemRole == SystemRole.Admin && !await context.Users.AnyAsync(u => u.Id != userId && u.SystemRole == SystemRole.Admin && u.Status == UserStatus.Active))
            throw new BusinessRuleException("Không thể khóa quản trị viên cuối cùng.");

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
        return ToDto(user);
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
        return ToDto(user);
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

    private async Task<User> FindAsync(string userId)
    {
        return await context.Users.Include(u => u.Unit).FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
    }

    private static void CheckVersion(int current, int ifMatch)
    {
        if (ifMatch <= 0) throw new PreconditionRequiredException("Thiếu If-Match.");
        if (current != ifMatch) throw new PreconditionFailedException("Dữ liệu đã bị thay đổi bởi người khác.");
    }

    private static UserDto ToDto(User u)
    {
        return new(
            u.Id, u.Version, u.CreatedAt, u.UpdatedAt, u.Username, u.DisplayName, u.Email, u.UnitId,
            u.SystemRole.ToString().ToUpperInvariant(), u.Status.ToString().ToUpperInvariant(),
            new Models.Dtos.EntityLabelDto(u.UnitId, u.Unit?.Name ?? string.Empty));
    }
}
