using System.ComponentModel.DataAnnotations;

namespace Projects.Api.Models.Requests;

public record ProjectCreateRequest
{
    [Required, MinLength(2), MaxLength(32), RegularExpression("^[A-Z0-9_-]+$")]
    public string Code { get; init; } = null!;

    [Required, MaxLength(255)]
    public string Name { get; init; } = null!;

    [Required, MaxLength(2000)]
    public string Objective { get; init; } = null!;

    [Required, MaxLength(100)]
    public string UnitId { get; init; } = null!;

    [Required, MaxLength(100)]
    public string OwnerId { get; init; } = null!;

    [Required]
    public DateOnly StartDate { get; init; }

    [Required]
    public DateTime DueAt { get; init; }
}

public record ProjectPatchRequest
{
    [MaxLength(255)]
    public string? Name { get; init; }

    [MaxLength(2000)]
    public string? Objective { get; init; }

    [MaxLength(100)]
    public string? OwnerId { get; init; }

    public DateOnly? StartDate { get; init; }

    public DateTime? DueAt { get; init; }

    [Required, MaxLength(2000)]
    public string ChangeReason { get; init; } = null!;
}

public record TransferOwnerRequest
{
    [Required(ErrorMessage = "Vui lòng chọn người nhận bàn giao."), MaxLength(100)]
    public string NewOwnerId { get; init; } = null!;

    [Required(ErrorMessage = "Vui lòng nhập thông tin bắt buộc"), MaxLength(2000)]
    public string Reason { get; init; } = null!;
}

public record CancelProjectRequest
{
    [Required, MaxLength(2000)]
    public string Reason { get; init; } = null!;
}
