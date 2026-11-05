using System.ComponentModel.DataAnnotations;

namespace Identity.Api.Models.Requests;

public record TeamCreateRequest
{
    [Required, MaxLength(255)]
    public string Name { get; init; } = null!;
    [Required]
    public string UnitId { get; init; } = null!;
    [Required]
    public List<string> MemberIds { get; init; } = [];
}

public record TeamPatchRequest
{
    [MaxLength(255)]
    public string? Name { get; init; }
    public string? UnitId { get; init; }
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record TeamMembersRequest
{
    [Required]
    public List<string> MemberIds { get; init; } = [];
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}
