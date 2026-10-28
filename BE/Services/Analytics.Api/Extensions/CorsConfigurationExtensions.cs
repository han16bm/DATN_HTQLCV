namespace Analytics.Api.Extensions;

public static class CorsConfigurationExtensions
{
    public const string PolicyName = "AllowOrigin";

    public static IServiceCollection AddCorsConfiguration(this IServiceCollection services) =>
        services.AddCors(options => options.AddPolicy(PolicyName, policy =>
            policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin()));
}
