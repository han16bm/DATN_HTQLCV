using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Entities;
using Shared.Entities.Entities;
using Shared.Entities.Enums;

namespace Identity.Api.Services;

public class AuthService(ApplicationDbContext context, ITokenService tokenService) : IAuthService
{
    private static readonly PasswordHasher<User> Hasher = new();
    private const int MaxFailedAttempts = 5;

    public async Task<LoginResponseDto> LoginAsync(LoginRequest request)
    {
        var user = await context.Users.Include(u => u.Unit).FirstOrDefaultAsync(u => u.Username == request.Username)
            ?? throw new BusinessRuleException("Sai tên đăng nhập hoặc mật khẩu.");

        if (user.Status == UserStatus.Locked)
            throw new ForbiddenException("Tài khoản đã bị khóa.");

        var verify = Hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verify == PasswordVerificationResult.Failed)
        {
            user.FailedLoginCount++;
            if (user.FailedLoginCount >= MaxFailedAttempts)
            {
                user.Status = UserStatus.Locked;
                user.LockedAt = DateTime.UtcNow;
                user.LockReason = "Vượt quá số lần đăng nhập sai cho phép.";
            }
            await context.SaveChangesAsync();
            throw new BusinessRuleException("Sai tên đăng nhập hoặc mật khẩu.");
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
            throw new ForbiddenException("Tài khoản đã bị khóa.");

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

    private async Task<SessionDto> BuildSessionAsync(User user)
    {
        var access = await context.ProjectMemberships
            .Where(m => m.UserId == user.Id && m.EndedAt == null)
            .Select(m => new ProjectAccessDto(m.ProjectId, m.ProjectRole.ToString().ToUpperInvariant()))
            .ToListAsync();

        var userDto = new UserDto(
            user.Id, user.Version, user.CreatedAt, user.UpdatedAt, user.Username, user.DisplayName, user.Email,
            user.UnitId, user.SystemRole.ToString().ToUpperInvariant(), user.Status.ToString().ToUpperInvariant(),
            new Models.Dtos.EntityLabelDto(user.UnitId, user.Unit?.Name ?? string.Empty));

        return new SessionDto(userDto, access);
    }
}
