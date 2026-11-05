using Analytics.Api.Interfaces;

namespace Analytics.Api.Services;

/// <summary>Tick 30 giây, mỗi tick đọc BackgroundJobs và chạy job nào IsEnabled và đã tới NextRunAt (DB là nguồn sự thật).</summary>
public class AlertGenerationBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<AlertGenerationBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan Tick = TimeSpan.FromSeconds(30);
    private bool _initialized;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Tick);
        do
        {
            await RunTickAsync(stoppingToken);
        }
        while (await WaitNextTickAsync(timer, stoppingToken));
    }

    private async Task RunTickAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var jobs = scope.ServiceProvider.GetRequiredService<IJobService>();
            // Chỉ khởi tạo một lần (lần đầu thành công) — gọi lại sẽ đánh dấu FAILED cả lần chạy thủ công đang diễn ra
            if (!_initialized)
            {
                await jobs.EnsureJobsAsync(stoppingToken);
                _initialized = true;
            }
            await jobs.RunDueJobsAsync(stoppingToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Tick job nền lỗi, bỏ qua lần này.");
        }
    }

    private static async Task<bool> WaitNextTickAsync(PeriodicTimer timer, CancellationToken stoppingToken)
    {
        try
        {
            return await timer.WaitForNextTickAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }
}
