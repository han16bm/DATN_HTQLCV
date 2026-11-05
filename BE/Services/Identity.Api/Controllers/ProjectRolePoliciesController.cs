using Identity.Api.Extensions;
using Identity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Entities;
using Shared.Entities.Authorization;

namespace Identity.Api.Controllers;

/// <summary>Ma trận quyền theo vai trò dự án — màn Phân quyền / Vai trò dự án.</summary>
[Authorize]
[AdminArea]
[ApiController]
[Route("api/project-role-policies")]
public class ProjectRolePoliciesController(ILogger<BaseApiController> logger, ProjectRolePolicyService service) : BaseApiController(logger)
{
    [RequiresPermission(PermissionFeatures.PermissionsManage, PermissionFeatures.UsersManage)]
    [HttpGet]
    public async Task<object> List()
    {
        return await service.ListAsync();
    }

    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    [HttpPatch("{role}")]
    public async Task<object> Update(string role, [FromBody] UpdateProjectRolePolicyRequest request)
    {
        return await service.UpdateAsync(role, request, Request.GetIfMatchVersion());
    }
}
