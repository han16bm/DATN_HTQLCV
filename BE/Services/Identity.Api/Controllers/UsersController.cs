using Identity.Api.Extensions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(ILogger<BaseApiController> logger, IUserService userService) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] UserQuery query)
    {
        return await userService.ListAsync(query);
    }

    [HttpGet("{userId}")]
    public async Task<object> Get(string userId)
    {
        return await userService.GetAsync(userId);
    }

    [HttpPost]
    public async Task<object> Create([FromBody] UserCreateRequest request)
    {
        return await userService.CreateAsync(request);
    }

    [HttpPatch("{userId}")]
    public async Task<object> Update(string userId, [FromBody] UserPatchRequest request)
    {
        return await userService.UpdateAsync(userId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{userId}/lock")]
    public async Task<object> Lock(string userId, [FromBody] UserLockRequest request)
    {
        return await userService.LockAsync(userId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{userId}/unlock")]
    public async Task<object> Unlock(string userId, [FromBody] ReasonRequest request)
    {
        return await userService.UnlockAsync(userId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{userId}/reset-password")]
    public async Task<object> ResetPassword(string userId, [FromBody] ResetPasswordRequest request)
    {
        await userService.ResetPasswordAsync(userId, request);
        return new { ok = true };
    }
}
