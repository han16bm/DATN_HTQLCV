using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Identity.Api.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Shared.Entities.Entities;

namespace Identity.Api.Services;

public class TokenService(IOptionsMonitor<JwtOptions> options) : ITokenService
{
    public (string AccessToken, DateTime ExpiresAt) CreateAccessToken(User user)
    {
        // Jwt:AccessTokenHours đến từ cấu hình tập trung và đổi được lúc chạy (IOptionsMonitor)
        var jwt = options.CurrentValue;
        var expiresAt = DateTime.UtcNow.AddHours(Math.Clamp(jwt.AccessTokenHours, 1, 24));
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("tv", user.TokenVersion.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey));
        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
