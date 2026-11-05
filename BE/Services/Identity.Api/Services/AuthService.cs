using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Shared.Commons.Exceptions;
using Shared.Configuration;
using Shared.Entities;
using Shared.Entities.Authorization;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Identity.Api.Services;

public class AuthService(
    ApplicationDbContext context,
    ITokenService tokenService,
    IOptionsMonitor<AuthOptions> authOptions,
    IpAccessGuard ipAccessGuard,
    IHttpContextAccessor httpContextAccessor) : IAuthService
{
    private static readonly PasswordHasher<User> Hasher = new();

    public async Task<LoginResponseDto> LoginAsync(LoginRequest request)
    {
        // Kiểm tra IP (Scope SYSTEM) trước khi xác thực mật khẩu: IP bị chặn không dò được mật khẩu, vẫn ghi username đã thử
        var http = httpContextAccessor.HttpContext;
        if (http is not null && await ipAccessGuard.CheckAsync(http, ConfigCatalog.IpScopeSystem, request.Username) is { } denied)
            throw denied;

        var user = await context.Users.Include(u => u.Unit).FirstOrDefaultAsync(u => u.Username == request.Username)
            ?? throw new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu.");

        var verify = Hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        // Tài khoản đã khoá: sai mật khẩu chỉ nhận lỗi chung (không lộ trạng thái/lý do khoá, không đếm thêm).
        if (user.Status == UserStatus.Locked)
            throw verify == PasswordVerificationResult.Failed
                ? new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu.")
                : AccountLocked(user);
        if (verify == PasswordVerificationResult.Failed)
        {
            user.FailedLoginCount++;
            // Auth:MaxFailedAttempts đến từ cấu hình tập trung, đọc giá trị mới nhất mỗi lần
            var maxAttempts = Math.Max(authOptions.CurrentValue.MaxFailedAttempts, 1);
            if (user.FailedLoginCount >= maxAttempts)
            {
                user.Status = UserStatus.Locked;
                user.LockedAt = DateTime.UtcNow;
                user.LockReason = "Vượt quá số lần đăng nhập sai cho phép.";
                await context.SaveChangesAsync();
                throw new ForbiddenException(
                    $"Bạn đã nhập sai mật khẩu quá {maxAttempts} lần nên tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên để được mở khoá.")
                {
                    Code = "ACCOUNT_LOCKED"
                };
            }
            await context.SaveChangesAsync();
            throw new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu.");
        }

        user.FailedLoginCount = 0;
        await context.SaveChangesAsync();

        var (token, expiresAt) = tokenService.CreateAccessToken(user);
        var session = await BuildSessionAsync(user);
        return new LoginResponseDto(session, token, expiresAt);
    }

    public async Task<LoginResponseDto> RefreshAsync(string userId)
    {
        var user = await context.Users.Include(u => u.Unit).FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        if (user.Status == UserStatus.Locked)
            throw AccountLocked(user);

        var (token, expiresAt) = tokenService.CreateAccessToken(user);
        var session = await BuildSessionAsync(user);
        return new LoginResponseDto(session, token, expiresAt);
    }

    public async Task<SessionDto> GetSessionAsync(string userId)
    {
        var user = await context.Users.Include(u => u.Unit).FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        return await BuildSessionAsync(user);
    }

    public async Task LogoutAsync(string userId)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        user.TokenVersion++;
        await context.SaveChangesAsync();
    }

    private static ForbiddenException AccountLocked(User user)
    {
        var reason = user.LockReason?.Trim().TrimEnd('.');
        var detail = string.IsNullOrEmpty(reason) ? string.Empty : $" ({reason})";
        return new ForbiddenException($"Tài khoản của bạn đang bị khoá{detail}. Vui lòng liên hệ quản trị viên để được mở khoá.")
        {
            Code = "ACCOUNT_LOCKED"
        };
    }

    private async Task<SessionDto> BuildSessionAsync(User user)
    {
        var projects = await ProjectAccess.LoadAsync(context, user.Id);
        var access = projects.ProjectIds
            .Select(id => new ProjectAccessDto(id, projects.RoleIn(id)!.Value.ToString().ToUpperInvariant(), projects.PermissionsIn(id)))
            .ToList();

        var userDto = UserService.ToDto(user, await UserService.LoadActiveGroupsAsync(context, [user.Id]), null);

        return new SessionDto(userDto, access, projects.SystemPermissions.ToList());
    }
}
