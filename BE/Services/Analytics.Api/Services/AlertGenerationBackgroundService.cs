using Analytics.Api.Interfaces;
using Microsoft.Extensions.Options;

namespace Analytics.Api.Services;

public class AlertGenerationBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<AlertGenerationOptions> options,
    ILogger<AlertGenerationBackgroundService> logger) : BackgroundService
{
    private readonly AlertGenerationOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            logger.LogInformation("Job sinh cảnh báo tự động đang bị tắt qua cấu hình.");
            return;
        }

        var interval = TimeSpan.FromMinutes(Math.Max(1, _options.IntervalMinutes));
        using var timer = new PeriodicTimer(interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            await RunOnceAsync(stoppingToken);
            try
            {
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var generator = scope.ServiceProvider.GetRequiredService<IAlertGenerationService>();
        try
        {
            await generator.GenerateAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Job sinh cảnh báo tự động chạy lỗi, bỏ qua lần này.");
        }
    }
}
