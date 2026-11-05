using System.ComponentModel.DataAnnotations;
using Shared.Entities.Enums;

namespace Projects.Api.Models.Requests;

public record MemberCreateRequest
{
    [Required, MaxLength(100)]
    public string UserId { get; init; } = null!;

    [Required]
    public ProjectRole ProjectRole { get; init; }
}

public record MemberRoleRequest
{
    [Required]
    public ProjectRole ProjectRole { get; init; }

    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record EndMembershipRequest
{
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}
