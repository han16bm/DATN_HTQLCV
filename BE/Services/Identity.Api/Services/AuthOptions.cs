namespace Identity.Api.Services;

public class AuthOptions
{
    public int MaxFailedAttempts { get; set; } = 5;
}
