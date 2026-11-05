namespace Identity.Api.Services;

public class JwtOptions
{
    public string Issuer { get; set; } = null!;
    public string Audience { get; set; } = null!;
    public string SigningKey { get; set; } = null!;
    public int AccessTokenHours { get; set; } = 8;
}
