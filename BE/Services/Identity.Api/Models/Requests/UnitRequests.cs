using System.ComponentModel.DataAnnotations;

namespace Identity.Api.Models.Requests;

public record UnitCreateRequest
{
    [Required, MaxLength(255)]
    public string Name { get; init; } = null!;
    public string? ParentId { get; init; }
    public string? ManagerId { get; init; }
}

public record UnitPatchRequest
{
    [MaxLength(255)]
    public string? Name { get; init; }
    public string? ParentId { get; init; }
    public string? ManagerId { get; init; }
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}
