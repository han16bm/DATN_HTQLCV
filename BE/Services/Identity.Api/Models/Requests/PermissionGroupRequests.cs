using System.ComponentModel.DataAnnotations;

namespace Identity.Api.Models.Requests;

public record PermissionGroupCreateRequest
{
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
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record PermissionGroupMembersRequest
{
    [Required]
    public List<string> MemberIds { get; init; } = [];
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}
