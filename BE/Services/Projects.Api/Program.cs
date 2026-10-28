using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Projects.Api.Extensions;
using Projects.Api.Filters;
using Serilog;
using Shared.Entities;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));

builder.Services.AddEntityServices(builder.Configuration);
builder.Services.AddDependencyInjection(builder.Configuration);

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

builder.Services.AddScoped<LogExceptionFilter>();
builder.Services.AddControllers(options => options.Filters.Add<LogExceptionFilter>())
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Projects.Api"));

app.UseAuthentication();
app.UseAuthorization();
app.UseSerilogRequestLogging();
app.MapControllers();

app.Run();
