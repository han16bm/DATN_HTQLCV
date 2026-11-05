using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Api.Models.Requests;

/// <summary>PATCH /api/auth/me (multipart/form-data): chỉ gửi trường cần đổi; kiểm tra chi tiết ở ProfileService.</summary>
public sealed class ProfileUpdateForm
{
    [FromForm(Name = "username")]
    public string? Username { get; init; }

    [FromForm(Name = "displayName")]
    public string? DisplayName { get; init; }

    [FromForm(Name = "avatar")]
    public IFormFile? Avatar { get; init; }
}

public sealed record ChangePasswordRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại."), MaxLength(128)]
    public string CurrentPassword { get; init; } = null!;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới."), MinLength(8, ErrorMessage = "Mật khẩu mới phải có ít nhất 8 ký tự."), MaxLength(128)]
    public string NewPassword { get; init; } = null!;
}
