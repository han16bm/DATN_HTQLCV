using Shared.Configuration;
using System.Text;
using Gateway.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
// Cấu hình tập trung: appsettings.Shared.json (connection string, signing key) + bảng SystemConfigs
builder.AddCentralConfiguration(ConfigCatalog.Gateway);

builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));

var jwt = builder.Configuration.GetSection("Jwt");
var jwtSigningKey = jwt["SigningKey"];
if (string.IsNullOrWhiteSpace(jwtSigningKey) || jwtSigningKey == "CHANGE_ME_DEV_ONLY_SIGNING_KEY_MIN_32_CHARS")
    throw new InvalidOperationException(
        "Jwt:SigningKey chưa được cấu hình. Chạy 'dotnet user-secrets set \"Jwt:SigningKey\" \"<giá trị ngẫu nhiên>\"' cho dev, hoặc đặt biến môi trường Jwt__SigningKey khi deploy — không để giá trị thật trong appsettings.json.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey)),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true
        };
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(
                    new Shared.Commons.Models.ErrorResponse("UNAUTHORIZED", "Phiên đăng nhập đã hết hạn hoặc không hợp lệ."),
                    Shared.Commons.Models.JsonDefaults.Web);
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(
                    new Shared.Commons.Models.ErrorResponse("FORBIDDEN", "Bạn không có quyền truy cập."),
                    Shared.Commons.Models.JsonDefaults.Web);
            }
        };
    });

builder.Services.AddAuthorization();

// Dev: mọi origin (FE :3000 gọi gateway :5000). Môi trường khác: chỉ origin trong Cors:AllowedOrigins.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
        policy.SetIsOriginAllowed(origin => builder.Environment.IsDevelopment()
                || allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            // FE đọc tên tệp tải về từ Content-Disposition; header không expose thì trình duyệt giấu khi khác origin.
            .WithExposedHeaders("Content-Disposition", "ETag"));
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseMiddleware<TraceIdMiddleware>();
app.UseCors("Default");
app.UseAuthentication();
app.UseAuthorization();
app.UseSerilogRequestLogging();

// Đăng nhập/tạo tài khoản ban đầu không yêu cầu token sẵn có; các route còn lại đi qua forward-auth phía gateway.
app.MapReverseProxy();

app.Run();
