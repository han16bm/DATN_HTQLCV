namespace Analytics.Api.Services;

public class AlertGenerationOptions
{
    public bool Enabled { get; set; } = true;
    public int IntervalMinutes { get; set; } = 15;
}
