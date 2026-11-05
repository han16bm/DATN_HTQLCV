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
    public async Task<object> UpdateProfile()
    {
        if (!Request.HasFormContentType)
            throw new Shared.Commons.Exceptions.ValidationException("Hồ sơ gửi dạng multipart/form-data.");
        var form = await Request.ReadFormAsync();
        return await profileService.UpdateProfileAsync(HttpContext.GetUserId()!, form, Request.GetIfMatchVersion());
    }

    // Hồ sơ riêng của người đăng nhập; không nhận userId/query (query thừa → 422, như mock).
    [HttpGet("me/profile")]
    [Authorize]
    public async Task<object> Profile()
    {
        if (Request.Query.Count > 0)
            throw new Shared.Commons.Exceptions.ValidationException("Hồ sơ cá nhân không nhận tham số truy vấn.");
        return await profileService.GetProfileAsync(HttpContext.GetUserId()!);
    }

    [HttpPut("me/password")]
    [Authorize]
    public async Task<object> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        return await profileService.ChangePasswordAsync(HttpContext.GetUserId()!, request);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<object> Logout()
    {
        await authService.LogoutAsync(HttpContext.GetUserId()!);
        return new { ok = true };
    }
}
