using Identity.Api.Interfaces;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Extensions;

namespace Identity.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(ILogger<BaseApiController> logger, IAuthService authService) : BaseApiController(logger)
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<object> Login([FromBody] LoginRequest request)
    {
        return await authService.LoginAsync(request);
    }

    [HttpPost("refresh")]
    [Authorize]
    public async Task<object> Refresh()
    {
        return await authService.RefreshAsync(HttpContext.GetUserId()!);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<object> Me()
    {
        return await authService.GetSessionAsync(HttpContext.GetUserId()!);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<object> Logout()
    {
        await authService.LogoutAsync(HttpContext.GetUserId()!);
        return new { ok = true };
    }
}
