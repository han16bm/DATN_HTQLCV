using Shared.Configuration;
using System.Text;
using Identity.Api.Extensions;
using Identity.Api.Filters;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Shared.Entities;

var builder = WebApplication.CreateBuilder(args);
// Cấu hình tập trung: appsettings.Shared.json (connection string, signing key) + bảng SystemConfigs
builder.AddCentralConfiguration(ConfigCatalog.IdentityApi);

builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));

builder.Services.AddDependencyInjection(builder.Configuration);
builder.Services.AddEntityServices(builder.Configuration);
builder.Services.AddCorsConfiguration(builder.Environment);
builder.Services.AddScoped<LogExceptionFilter>();

builder.Services.AddControllers(options =>
{
    options.Filters.Add<LogExceptionFilter>();
    options.ModelBinderProviders.Insert(0, new Shared.Commons.Extensions.SnakeCaseEnumModelBinderProvider());
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new Shared.Commons.Models.PagedResultJsonConverterFactory());
});

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
            OnTokenValidated = async context =>
            {
                var userId = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var tokenVersionClaim = context.Principal?.FindFirst("tv")?.Value;
                if (userId is null || tokenVersionClaim is null || !int.TryParse(tokenVersionClaim, out var tokenVersion))
                {
                    context.Fail("Token thiếu thông tin bắt buộc.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                if (user is null || user.Status == Shared.Entities.Enums.UserStatus.Locked || user.TokenVersion != tokenVersion)
                {
                    context.Fail("Phiên đăng nhập không còn hợp lệ.");
                }
            },
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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Identity.Api V1"));

// IP client thật cho [AdminArea] và bộ lọc IP phạm vi SYSTEM; cấu hình proxy tin cậy (loopback) ở Shared.Entities.AddEntityServices
app.UseForwardedHeaders();
app.UseCors(CorsConfigurationExtensions.PolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.UseSerilogRequestLogging();
app.MapControllers();

app.Run();
