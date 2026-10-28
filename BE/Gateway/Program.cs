using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

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
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
        policy.SetIsOriginAllowed(_ => builder.Environment.IsDevelopment())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseCors("Default");
app.UseAuthentication();
app.UseAuthorization();
app.UseSerilogRequestLogging();

// Đăng nhập/tạo tài khoản ban đầu không yêu cầu token sẵn có; các route còn lại đi qua forward-auth phía gateway.
app.MapReverseProxy();

app.Run();
