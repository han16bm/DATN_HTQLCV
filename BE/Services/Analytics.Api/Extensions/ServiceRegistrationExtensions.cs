using Analytics.Api.Interfaces;
using Analytics.Api.Services;

namespace Analytics.Api.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddDependencyInjection(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<AnalysisSnapshotStore>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IAnalysisService, AnalysisService>();
        services.AddScoped<IAlertService, AlertService>();

        services.Configure<AlertGenerationOptions>(configuration.GetSection("AlertGeneration"));
        services.AddScoped<IAlertGenerationService, AlertGenerationService>();
        services.AddScoped<IJobService, JobService>();
        services.AddHostedService<AlertGenerationBackgroundService>();

        return services;
    }
}
