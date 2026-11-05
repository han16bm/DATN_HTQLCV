using Microsoft.Extensions.DependencyInjection;

namespace Analytics.Api.Services;

public sealed class AnalysisGenerationBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<AnalysisGenerationBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<AnalysisJobProcessor>();
                var foundWork = await processor.ProcessNextAsync(stoppingToken);
                if (!foundWork)
                    await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Analysis generation worker encountered an unexpected error.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }
}
