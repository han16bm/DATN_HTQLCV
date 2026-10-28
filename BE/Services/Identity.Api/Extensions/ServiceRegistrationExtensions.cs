using Identity.Api.Interfaces;
using Identity.Api.Services;

namespace Identity.Api.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddDependencyInjection(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUnitService, UnitService>();
        services.AddScoped<ITeamService, TeamService>();

        return services;
    }
}
