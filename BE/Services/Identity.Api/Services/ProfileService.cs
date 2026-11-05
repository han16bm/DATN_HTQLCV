using System.Text.RegularExpressions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Shared.Commons.Exceptions;
using Shared.Commons.Models;
using Shared.Commons.Storage;
using Shared.Entities;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

/// <summary>
/// Hồ sơ của chính người đăng nhập: GET /api/auth/me/profile, PATCH /api/auth/me (tên hiển thị, thông tin cá nhân, ảnh đại diện) và
/// PUT /api/auth/me/password — cùng quy tắc/mã lỗi với mock (authDb.updateProfile/changePassword).
/// Ảnh lưu qua IFileStorage (Cloudinary khi đủ cấu hình, ngược lại đĩa cục bộ phục vụ ở /api/avatars/{name}).
/// </summary>
public partial class ProfileService(
    ApplicationDbContext context,
    IHttpContextAccessor httpContextAccessor,
    IAuthService authService,
    ITokenService tokenService,
    IOptionsMonitor<AuthOptions> authOptions,
    IFileStorage storage) : BaseService<User>(context, httpContextAccessor), IProfileService
{
    public const long MaxAvatarBytes = 2 * 1024 * 1024;
    private const string AvatarFolder = "avatars";
    private static readonly string[] AvatarTypes = ["image/jpeg", "image/png", "image/webp"];
    private static readonly PasswordHasher<User> Hasher = new();

    private static readonly HashSet<string> EditableFields = ["displayName", .. PersonalInfoRules.Fields];

    /// <summary>Hồ sơ riêng (GET /api/auth/me/profile): thông tin cá nhân + nhóm/dự án đang tham gia.</summary>
    public async Task<PersonalProfileDto> GetProfileAsync(string userId)
    {
        var user = await context.Users.Include(u => u.Unit).AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        var groups = await UserService.LoadActiveGroupsAsync(context, [user.Id]);
        var names = await LoadDisplayNamesAsync([user.CreatedBy, user.UpdatedBy]);
        var affiliations = await UserService.LoadAffiliationsAsync(context, user.Id);
        return new PersonalProfileDto(user.Version, user.CreatedAt, user.Username, user.DisplayName, user.Email, user.IsSysAdmin,
            groups.GetValueOrDefault(user.Id, []), user.Unit?.Name ?? string.Empty,
            PersonRef(user.CreatedBy, names), PersonRef(user.UpdatedBy, names),
            user.Gender, user.BirthDate, user.Phone, user.PermanentAddress, user.TemporaryAddress,
            affiliations.Teams, affiliations.Projects);
    }

    /// <summary>
    /// PATCH /api/auth/me (multipart): displayName, 5 trường cá nhân và avatar; chuỗi rỗng = xóa giá trị cá nhân.
    /// Trường ngoài whitelist (username, email, unitId, position, teams...) → 422, không lưu gì.
    /// </summary>
    public async Task<SessionDto> UpdateProfileAsync(string userId, IFormCollection form, int ifMatchVersion)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        CheckVersion(user.Version, ifMatchVersion);

        var unknown = form.Keys.Where(k => !EditableFields.Contains(k))
            .Concat(form.Files.Select(f => f.Name).Where(n => n != "avatar"))
            .ToList();
        if (unknown.Count > 0)
            throw new ValidationException($"Không được cập nhật trường: {string.Join(", ", unknown)}.", [unknown[0]]);
        var avatarFile = form.Files.GetFile("avatar");
        if (form.Keys.Count == 0 && avatarFile is null)
            throw new ValidationException("Chưa có thông tin thay đổi.");

        var before = new { user.DisplayName, user.AvatarUrl, Personal = PersonalInfoRules.Snapshot(user) };
        if (form.TryGetValue("displayName", out var displayNameValue))
        {
            var displayName = displayNameValue.ToString().Trim();
            if (displayName.Length is 0 or > 255)
                throw new ValidationException(
                    displayName.Length == 0 ? "Vui lòng nhập thông tin bắt buộc" : "Tên hiển thị tối đa 255 ký tự.", ["displayName"]);
            user.DisplayName = displayName;
        }
        // Kiểm tra hết trước khi lưu ảnh: dữ liệu sai thì không thay đổi gì (kể cả ảnh).
        foreach (var field in PersonalInfoRules.Fields)
            if (form.TryGetValue(field, out var value))
                PersonalInfoRules.Apply(user, field, value.ToString());

        var avatar = avatarFile is null ? null : await SaveAvatarAsync(avatarFile);
        var replacedKey = avatar is null ? null : user.AvatarKey;
        if (avatar is not null)
        {
            user.AvatarUrl = avatar.PublicUrl;
            user.AvatarKey = avatar.Key;
        }
        user.Version++;
        await WriteAuditLog(user.Id, "UPDATE_PROFILE", before,
            new { user.DisplayName, user.AvatarUrl, Personal = PersonalInfoRules.Snapshot(user) });

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

    public async Task<ChangePasswordResultDto> ChangePasswordAsync(string userId, ChangePasswordRequest request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("Không tìm thấy tài khoản.");
        if (Hasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword) == PasswordVerificationResult.Failed)
        {
            // Phiên bị lộ không được dò mật khẩu: sai liên tiếp tính chung bộ đếm và ngưỡng khóa như đăng nhập.
            user.FailedLoginCount++;
            var maxAttempts = Math.Max(authOptions.CurrentValue.MaxFailedAttempts, 1);
            if (user.FailedLoginCount >= maxAttempts)
            {
                user.Status = Shared.Entities.Enums.UserStatus.Locked;
                user.LockedAt = DateTime.UtcNow;
                user.LockReason = "Vượt quá số lần nhập sai mật khẩu cho phép.";
                user.TokenVersion++;
                await context.SaveChangesAsync();
                throw new ForbiddenException(
                    $"Bạn đã nhập sai mật khẩu quá {maxAttempts} lần nên tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên để được mở khoá.")
                {
                    Code = "ACCOUNT_LOCKED"
                };
            }
            await context.SaveChangesAsync();
            throw new AppException("Mật khẩu hiện tại chưa đúng.", ErrorCodes.Validation)
            {
                Code = "WRONG_PASSWORD",
                FieldErrors = [new FieldErrorItem(["currentPassword"], "Mật khẩu hiện tại chưa đúng.")]
            };
        }
        if (request.NewPassword == request.CurrentPassword)
            throw new ValidationException("Mật khẩu mới phải khác mật khẩu hiện tại.", ["newPassword"]);

        // Đổi mật khẩu thu hồi mọi phiên khác (TokenVersion++); phiên đang thao tác nhận token mới để tiếp tục.
        // Không tăng Version hồ sơ nên form hồ sơ đang mở không bị 412.
        user.PasswordHash = Hasher.HashPassword(user, request.NewPassword);
        user.FailedLoginCount = 0;
        user.TokenVersion++;
        await WriteAuditLog(user.Id, "CHANGE_PASSWORD", null, null);
        await context.SaveChangesAsync();
        var (token, expiresAt) = tokenService.CreateAccessToken(user);
        return new ChangePasswordResultDto(true, token, expiresAt);
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

    // Tên tệp do LocalFileStorage sinh: id (chữ/số) + đuôi ảnh.
    [GeneratedRegex(@"^[a-zA-Z0-9-]{8,64}\.(png|jpg|webp)$")]
    private static partial Regex AvatarName();
}
