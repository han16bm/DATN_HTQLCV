using System.ComponentModel.DataAnnotations;

namespace Identity.Api.Models.Requests;

public record SystemConfigCreateRequest
{
    [Required, MaxLength(200)]
    public string Key { get; init; } = null!;
    [Required, MaxLength(50)]
    public string ServiceType { get; init; } = null!;
    [Required, MaxLength(50)]
    public string Group { get; init; } = null!;
    [Required, MaxLength(255)]
    public string Name { get; init; } = null!;
    [MaxLength(1000)]
    public string? Description { get; init; }
    [Required]
    public string DataType { get; init; } = null!;
    [Required(AllowEmptyStrings = true)]
    public string Value { get; init; } = null!;
}

public record SystemConfigPatchRequest
{
    public string? Value { get; init; }
    [MaxLength(255)]
    public string? Name { get; init; }
    [MaxLength(1000)]
    public string? Description { get; init; }
    public bool? IsActive { get; init; }
    [Required, MinLength(1), MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record IpWhitelistEntryCreateRequest
{
    [Required, MaxLength(64)]
    public string Cidr { get; init; } = null!;
    [MaxLength(500)]
    public string? Description { get; init; }
}

public record IpAccessLogAllowRequest
{
    [MaxLength(64)]
    public string? Cidr { get; init; }
    [MaxLength(500)]
    public string? Description { get; init; }
    [Required, MinLength(1), MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record IpAccessLogDismissRequest
{
    [Required, MinLength(1), MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record IpWhitelistEntryPatchRequest
{
    [MaxLength(64)]
    public string? Cidr { get; init; }
    [MaxLength(500)]
    public string? Description { get; init; }
    public bool? IsActive { get; init; }
    [MaxLength(2000)]
    public string? Reason { get; init; }
}
