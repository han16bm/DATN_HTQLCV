using System.ComponentModel.DataAnnotations;

namespace Identity.Api.Models.Requests;

public record LoginRequest
{
    [Required, MaxLength(64)]
    public string Username { get; init; } = null!;
    [Required, MaxLength(128)]
    public string Password { get; init; } = null!;
}
