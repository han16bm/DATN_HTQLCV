using Analytics.Api.Interfaces;
using Analytics.Api.Services;

namespace Analytics.Api.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddDependencyInjection(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IAlertService, AlertService>();
        return services;
    }
}
