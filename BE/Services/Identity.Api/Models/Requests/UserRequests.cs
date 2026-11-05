using System.ComponentModel.DataAnnotations;

namespace Identity.Api.Models.Requests;

public record UserCreateRequest
{
    [Required, MinLength(3), MaxLength(64), RegularExpression("^[a-zA-Z0-9._-]+$")]
    public string Username { get; init; } = null!;
    [Required, MaxLength(255)]
    public string DisplayName { get; init; } = null!;
    [Required, EmailAddress]
    public string Email { get; init; } = null!;
    [Required]
    public string UnitId { get; init; } = null!;
    public List<string> GroupIds { get; init; } = [];
    [Required, MinLength(8), MaxLength(128)]
    public string InitialPassword { get; init; } = null!;

    // Thông tin cá nhân tùy chọn (chuỗi rỗng = bỏ trống), kiểm tra ở PersonalInfoRules.
    public string? Gender { get; init; }
    public string? BirthDate { get; init; }
    public string? Phone { get; init; }
    public string? PermanentAddress { get; init; }
    public string? TemporaryAddress { get; init; }
}

// Trường lạ (position, systemRole, username...) → 422 thay vì bị bỏ qua lặng lẽ.
[System.Text.Json.Serialization.JsonUnmappedMemberHandling(System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow)]
public record UserPatchRequest
{
    // Thông tin cá nhân: chỉ trường có mặt trong body mới được ghi (null = xóa giá trị).
    private readonly Dictionary<string, string?> _personal = new();
    public string? Gender { get => _personal.GetValueOrDefault("gender"); init => _personal["gender"] = value; }
    public string? BirthDate { get => _personal.GetValueOrDefault("birthDate"); init => _personal["birthDate"] = value; }
    public string? Phone { get => _personal.GetValueOrDefault("phone"); init => _personal["phone"] = value; }
    public string? PermanentAddress { get => _personal.GetValueOrDefault("permanentAddress"); init => _personal["permanentAddress"] = value; }
    public string? TemporaryAddress { get => _personal.GetValueOrDefault("temporaryAddress"); init => _personal["temporaryAddress"] = value; }
    public IEnumerable<KeyValuePair<string, string?>> PersonalFields() => _personal;

    [MaxLength(255)]
    public string? DisplayName { get; init; }
    [EmailAddress]
    public string? Email { get; init; }
    public string? UnitId { get; init; }
    [MaxLength(2000)]
    public string? Reason { get; init; }
}

public record UserPermissionsRequest
{
    [Required]
    public bool? IsSysAdmin { get; init; }
    [Required]
    public List<string> GrantedFeatures { get; init; } = [];
    [Required]
    public List<string> RevokedFeatures { get; init; } = [];
    [Required]
    public List<string> GroupIds { get; init; } = [];
    [Required, MinLength(1), MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record UserLockRequest
{
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
    [Required]
    public string Mode { get; init; } = null!; // NORMAL | EMERGENCY
}

public record ReasonRequest
{
    [Required, MinLength(1), MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record ResetPasswordRequest
{
    [Required, MinLength(8), MaxLength(128)]
    public string TemporaryPassword { get; init; } = null!;
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}
