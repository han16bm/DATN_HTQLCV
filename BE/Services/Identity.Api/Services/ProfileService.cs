using System.Text.RegularExpressions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Shared.Commons.Exceptions;
using Shared.Commons.Models;
using Shared.Commons.Storage;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

/// <summary>
/// Hồ sơ của chính người đăng nhập: PATCH /api/auth/me (tên đăng nhập, tên hiển thị, ảnh đại diện) và
/// PUT /api/auth/me/password — cùng quy tắc/mã lỗi với mock (authDb.updateProfile/changePassword).
/// Ảnh lưu qua IFileStorage (Cloudinary khi đủ cấu hình, ngược lại đĩa cục bộ phục vụ ở /api/avatars/{name}).
/// </summary>
public partial class ProfileService(
    ApplicationDbContext context,
    IHttpContextAccessor httpContextAccessor,
    IAuthService authService,
    IFileStorage storage) : BaseService<User>(context, httpContextAccessor), IProfileService
{
    public const long MaxAvatarBytes = 2 * 1024 * 1024;
    private const string AvatarFolder = "avatars";
    private static readonly string[] AvatarTypes = ["image/jpeg", "image/png", "image/webp"];
    private static readonly PasswordHasher<User> Hasher = new();

    public async Task<SessionDto> UpdateProfileAsync(string userId, ProfileUpdateForm form, int ifMatchVersion)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        CheckVersion(user.Version, ifMatchVersion);

        var username = form.Username?.Trim();
        var displayName = form.DisplayName?.Trim();
        if (username is null && displayName is null && form.Avatar is null)
            throw new ValidationException("Chưa có thông tin thay đổi.");
        if (username is not null && (username.Length is < 3 or > 64 || !UsernamePattern().IsMatch(username)))
            throw new ValidationException(
                "Tên đăng nhập dài 3–64 ký tự, chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.", ["username"]);
        if (displayName is not null && displayName.Length is 0 or > 255)
            throw new ValidationException(
                displayName.Length == 0 ? "Vui lòng nhập thông tin bắt buộc" : "Tên hiển thị tối đa 255 ký tự.", ["displayName"]);
        if (username is not null && username != user.Username
            && await context.Users.AnyAsync(u => u.Id != user.Id && u.Username == username))
            throw new AppException("Tên đăng nhập đã được sử dụng.", ErrorCodes.Conflict)
            {
                Code = "DUPLICATE_USERNAME",
                FieldErrors = [new FieldErrorItem(["username"], "Tên đăng nhập đã tồn tại.")]
            };

        var avatar = form.Avatar is null ? null : await SaveAvatarAsync(form.Avatar);
        var before = new { user.Username, user.DisplayName, user.AvatarUrl };
        var replacedKey = avatar is null ? null : user.AvatarKey;
        if (username is not null) user.Username = username;
        if (displayName is not null) user.DisplayName = displayName;
        if (avatar is not null)
        {
            user.AvatarUrl = avatar.PublicUrl;
            user.AvatarKey = avatar.Key;
        }
        user.Version++;
        await WriteAuditLog(user.Id, "UPDATE_PROFILE", before, new { user.Username, user.DisplayName, user.AvatarUrl });

        try
        {
            await context.SaveChangesAsync();
        }
        catch
        {
            if (avatar is not null) await storage.DeleteAsync(avatar.Key);
            throw;
        }
        if (replacedKey is not null) await storage.DeleteAsync(replacedKey);
        return await authService.GetSessionAsync(user.Id);
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        if (Hasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword) == PasswordVerificationResult.Failed)
            throw new AppException("Mật khẩu hiện tại chưa đúng.", ErrorCodes.Validation)
            {
                Code = "WRONG_PASSWORD",
                FieldErrors = [new FieldErrorItem(["currentPassword"], "Mật khẩu hiện tại chưa đúng.")]
            };
        if (request.NewPassword == request.CurrentPassword)
            throw new ValidationException("Mật khẩu mới phải khác mật khẩu hiện tại.", ["newPassword"]);

        // Không tăng Version/TokenVersion: phiên hiện tại giữ nguyên (FE chỉ nhận {ok}), form hồ sơ không bị 412.
        user.PasswordHash = Hasher.HashPassword(user, request.NewPassword);
        await WriteAuditLog(user.Id, "CHANGE_PASSWORD", null, null);
        await context.SaveChangesAsync();
    }

    public async Task<(Stream Content, string ContentType)> OpenAvatarAsync(string name)
    {
        var notFound = new NotFoundException("Không tìm thấy ảnh đại diện.") { Code = "AVATAR_NOT_FOUND" };
        if (!AvatarName().IsMatch(name)) throw notFound;
        var content = await storage.OpenReadAsync($"local:{AvatarFolder}/{name}") ?? throw notFound;
        var contentType = Path.GetExtension(name) switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "image/jpeg"
        };
        return (content, contentType);
    }

    private async Task<StoredFile> SaveAvatarAsync(IFormFile file)
    {
        if (file.Length == 0)
            throw new ValidationException("Ảnh đã chọn không có nội dung.", ["avatar"]);
        if (file.Length > MaxAvatarBytes)
            throw new ValidationException("Ảnh không được vượt quá 2 MB.", ["avatar"]);
        var contentType = (file.ContentType ?? string.Empty).ToLowerInvariant();
        if (!AvatarTypes.Contains(contentType))
            throw new ValidationException("Vui lòng chọn ảnh JPG, PNG hoặc WebP.", ["avatar"]);

        await using (var probe = file.OpenReadStream())
        {
            if (!FileSignatures.Matches(contentType, await FileSignatures.ReadHeaderAsync(probe)))
                throw new AppException("Tệp đã chọn không phải ảnh hợp lệ.", ErrorCodes.Validation)
                {
                    Code = "INVALID_AVATAR",
                    FieldErrors = [new FieldErrorItem(["avatar"], "Vui lòng chọn ảnh JPG, PNG hoặc WebP hợp lệ.")]
                };
        }

        await using var content = file.OpenReadStream();
        return await storage.SaveAsync(content, file.FileName, contentType, AvatarFolder, StoredFileAccess.Public);
    }

    [GeneratedRegex("^[a-zA-Z0-9._-]+$")]
    private static partial Regex UsernamePattern();

    // Tên tệp do LocalFileStorage sinh: id (chữ/số) + đuôi ảnh.
    [GeneratedRegex(@"^[a-zA-Z0-9-]{8,64}\.(png|jpg|webp)$")]
    private static partial Regex AvatarName();
}
