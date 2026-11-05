using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shared.Entities.Auditing;
using Shared.Entities.Authorization;

namespace Shared.Entities;

public static class DependencyInjection
{
    public static IServiceCollection AddEntityServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Thiếu connection string 'DefaultConnection'.");

        // Dấu vết người tạo/sửa (CreatedBy/UpdatedBy) điền tự động ở mọi lần SaveChanges — xem Auditing/AuditStampInterceptor
        services.AddHttpContextAccessor();
        services.AddScoped<AuditStampInterceptor>();
        services.AddDbContext<ApplicationDbContext>((provider, options) => options
            // DB từ xa (Neon): lỗi mạng tạm thời được thử lại thay vì trả 500 (service không tự mở transaction).
            .UseNpgsql(connectionString, npgsql => npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(2), null))
            .AddInterceptors(provider.GetRequiredService<AuditStampInterceptor>()));

        // IP whitelist (§5, §10): một quyết định dùng chung cho [AdminArea], bộ lọc phạm vi SYSTEM và đăng nhập
        services.AddSingleton<IpAccessRecorder>();
        services.AddScoped<IpAccessGuard>();
        services.Configure<MvcOptions>(options => options.Filters.Add<SystemIpAccessFilter>());

        // Gateway YARP chạy cùng máy và gắn X-Forwarded-For; chỉ tin header khi kết nối đến từ loopback
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();
            options.KnownProxies.Add(IPAddress.Loopback);
            options.KnownProxies.Add(IPAddress.IPv6Loopback);
        });

        return services;
    }
}
