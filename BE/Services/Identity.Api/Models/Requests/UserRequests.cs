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
    [Required]
    public string SystemRole { get; init; } = null!;
    [Required, MinLength(8), MaxLength(128)]
    public string InitialPassword { get; init; } = null!;
}

public record UserPatchRequest
{
    [MaxLength(255)]
    public string? DisplayName { get; init; }
    [EmailAddress]
    public string? Email { get; init; }
    public string? UnitId { get; init; }
    public string? SystemRole { get; init; }
    [MaxLength(2000)]
    public string? Reason { get; init; }
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
