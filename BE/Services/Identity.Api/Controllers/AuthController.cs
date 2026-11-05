using Identity.Api.Extensions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Extensions;
using Shared.Entities.Authorization;

namespace Identity.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(ILogger<BaseApiController> logger, IAuthService authService, IProfileService profileService) : BaseApiController(logger)
{
    [HttpPost("login")]
    [AllowAnonymous]
    [IpCheckedInAction]
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

    // Hồ sơ cá nhân (multipart: username?, displayName?, avatar?) — If-Match theo version của tài khoản.
    [HttpPatch("me")]
    [Authorize]
    [RequestSizeLimit(3 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 3 * 1024 * 1024)]
    public async Task<object> UpdateProfile([FromForm] ProfileUpdateForm form)
    {
        return await profileService.UpdateProfileAsync(HttpContext.GetUserId()!, form, Request.GetIfMatchVersion());
    }

    [HttpPut("me/password")]
    [Authorize]
    public async Task<object> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        await profileService.ChangePasswordAsync(HttpContext.GetUserId()!, request);
        return new { ok = true };
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<object> Logout()
    {
        await authService.LogoutAsync(HttpContext.GetUserId()!);
        return new { ok = true };
    }
}
