using Identity.Api.Extensions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Entities;
using Shared.Entities.Authorization;

namespace Identity.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(ILogger<BaseApiController> logger, IUserService userService) : BaseApiController(logger)
{
    // Danh sách user còn là picker trong màn đơn vị/team và thành viên nhóm quyền của khu admin
    [HttpGet]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage, PermissionFeatures.OrganizationManage, PermissionFeatures.PermissionsManage)]
    public async Task<object> List([FromQuery] UserQuery query)
    {
        return await userService.ListAsync(query);
    }

    [HttpGet("{userId}")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage)]
    public async Task<object> Get(string userId)
    {
        return await userService.GetAsync(userId);
    }

    [HttpGet("{userId}/profile")]
    public async Task<object> GetProfile(string userId)
    {
        return await userService.GetProfileAsync(userId);
    }

    [HttpPost]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage)]
    public async Task<object> Create([FromBody] UserCreateRequest request)
    {
        return await userService.CreateAsync(request);
    }

    [HttpPatch("{userId}")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage)]
    public async Task<object> Update(string userId, [FromBody] UserPatchRequest request)
    {
        return await userService.UpdateAsync(userId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{userId}/lock")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage)]
    public async Task<object> Lock(string userId, [FromBody] UserLockRequest request)
    {
        return await userService.LockAsync(userId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{userId}/unlock")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage)]
    public async Task<object> Unlock(string userId, [FromBody] ReasonRequest request)
    {
        return await userService.UnlockAsync(userId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{userId}/reset-password")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage)]
    public async Task<object> ResetPassword(string userId, [FromBody] ResetPasswordRequest request)
    {
        await userService.ResetPasswordAsync(userId, request);
        return new { ok = true };
    }

    // Thu hồi mọi phiên đăng nhập (máy mất, nghi lộ mật khẩu) mà không khóa tài khoản
    [HttpPost("{userId}/revoke-sessions")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage)]
    public async Task<object> RevokeSessions(string userId, [FromBody] ReasonRequest request)
    {
        await userService.RevokeSessionsAsync(userId, request);
        return new { ok = true };
    }

    // Người này đang giữ vai trò gì ở những dự án nào
    [HttpGet("{userId}/projects")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.UsersManage, PermissionFeatures.PermissionsManage)]
    public async Task<object> ListProjects(string userId)
    {
        return await userService.ListProjectsAsync(userId);
    }

    [HttpGet("{userId}/permissions")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    public async Task<object> GetPermissions(string userId)
    {
        return await userService.GetPermissionsAsync(userId);
    }

    [HttpPut("{userId}/permissions")]
    [AdminArea]
    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    public async Task<object> UpdatePermissions(string userId, [FromBody] UserPermissionsRequest request)
    {
        return await userService.UpdatePermissionsAsync(userId, request, Request.GetIfMatchVersion());
    }
}
