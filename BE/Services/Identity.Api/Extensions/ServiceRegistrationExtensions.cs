using Identity.Api.Interfaces;
using Identity.Api.Services;
using Shared.Commons.Storage;

namespace Identity.Api.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddDependencyInjection(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.Configure<AuthOptions>(configuration.GetSection("Auth"));

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUnitService, UnitService>();
        services.AddScoped<ITeamService, TeamService>();
        services.AddScoped<IPermissionGroupService, PermissionGroupService>();
        services.AddScoped<IFeatureService, FeatureService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<ISystemConfigService, SystemConfigService>();
        services.AddScoped<IIpWhitelistService, IpWhitelistService>();
        services.AddScoped<IIpAccessLogService, IpAccessLogService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<ProjectRolePolicyService>();
        // Ảnh đại diện: Cloudinary khi đủ Storage:Cloudinary, ngược lại đĩa cục bộ (App_Data/storage/avatars).
        services.AddFileStorage(configuration);

        return services;
    }
}
