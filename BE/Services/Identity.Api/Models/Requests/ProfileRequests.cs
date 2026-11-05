using System.ComponentModel.DataAnnotations;

namespace Identity.Api.Models.Requests;

public sealed record ChangePasswordRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại."), MaxLength(128)]
    public string CurrentPassword { get; init; } = null!;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới."), MinLength(8, ErrorMessage = "Mật khẩu mới phải có ít nhất 8 ký tự."), MaxLength(128)]
    public string NewPassword { get; init; } = null!;
}
