using Shared.Commons.Storage;
using Tasks.Api.Interfaces;
using Tasks.Api.Services;

namespace Tasks.Api.Extensions;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddDependencyInjection(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ITimeLogService, TimeLogService>();
        services.AddScoped<ISubmissionService, SubmissionService>();
        services.AddScoped<IAttachmentService, AttachmentService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<NotificationService>();
        // Minh chứng: Cloudinary (private/raw) khi đủ Storage:Cloudinary, ngược lại App_Data/storage/evidence.
        services.AddFileStorage(configuration);
        return services;
    }
}
