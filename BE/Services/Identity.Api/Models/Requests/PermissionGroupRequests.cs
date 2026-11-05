using System.ComponentModel.DataAnnotations;

namespace Identity.Api.Models.Requests;

public record PermissionGroupCreateRequest
{
    [Required, MaxLength(64), RegularExpression("^[A-Z0-9_]+$", ErrorMessage = "Mã nhóm chỉ gồm chữ in hoa, số và dấu gạch dưới.")]
    public string Code { get; init; } = null!;
    [Required, MaxLength(255)]
    public string Name { get; init; } = null!;
    [MaxLength(2000)]
    public string? Description { get; init; }
    [Required]
    public List<string> Features { get; init; } = [];
    [Required]
    public List<string> MemberIds { get; init; } = [];
}

public record PermissionGroupPatchRequest
{
    [MaxLength(255)]
    public string? Name { get; init; }
    [MaxLength(2000)]
    public string? Description { get; init; }
    public List<string>? Features { get; init; }
    [MaxLength(2000)]
    public string? Reason { get; init; }
}

public record PermissionGroupMembersRequest
{
    [Required]
    public List<string> MemberIds { get; init; } = [];
    [MaxLength(2000)]
    public string? Reason { get; init; }
}

public record FeaturePatchRequest
{
    [Required]
    public bool? IsActive { get; init; }
    [Required, MinLength(1), MaxLength(2000)]
    public string Reason { get; init; } = null!;
}
