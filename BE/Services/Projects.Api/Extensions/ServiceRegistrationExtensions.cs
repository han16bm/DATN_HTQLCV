using Projects.Api.Interfaces;
using Projects.Api.Services;

namespace Projects.Api.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddDependencyInjection(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IProjectMemberService, ProjectMemberService>();
        return services;
    }
}
