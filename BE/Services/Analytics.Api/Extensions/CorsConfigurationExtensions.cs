namespace Analytics.Api.Extensions;

public static class CorsConfigurationExtensions
{
    public const string PolicyName = "Default";

    public static IServiceCollection AddCorsConfiguration(this IServiceCollection services, IWebHostEnvironment env)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                policy.SetIsOriginAllowed(origin => env.IsDevelopment()).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
            });
        });
        return services;
    }
}
