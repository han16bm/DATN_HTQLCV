using Tasks.Api.Interfaces;
using Tasks.Api.Services;

namespace Tasks.Api.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddDependencyInjection(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ITimeLogService, TimeLogService>();
        services.AddScoped<ISubmissionService, SubmissionService>();
        services.AddScoped<IAttachmentService, AttachmentService>();
        services.AddScoped<IReportService, ReportService>();
        return services;
    }
}
