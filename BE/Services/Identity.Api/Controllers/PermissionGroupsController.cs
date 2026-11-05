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
[AdminArea]
[ApiController]
[Route("api/permission-groups")]
public class PermissionGroupsController(ILogger<BaseApiController> logger, IPermissionGroupService service) : BaseApiController(logger)
{
    [RequiresPermission(PermissionFeatures.PermissionsManage, PermissionFeatures.UsersManage)]
    [HttpGet]
    public async Task<object> List([FromQuery] PermissionGroupQuery query)
    {
        return await service.ListAsync(query);
    }

    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    [HttpGet("{groupId}")]
    public async Task<object> Get(string groupId)
    {
        return await service.GetAsync(groupId);
    }

    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    [HttpPost]
    public async Task<object> Create([FromBody] PermissionGroupCreateRequest request)
    {
        return await service.CreateAsync(request);
    }

    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    [HttpPatch("{groupId}")]
    public async Task<object> Update(string groupId, [FromBody] PermissionGroupPatchRequest request)
    {
        return await service.UpdateAsync(groupId, request, Request.GetIfMatchVersion());
    }

    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    [HttpPut("{groupId}/members")]
    public async Task<object> ReplaceMembers(string groupId, [FromBody] PermissionGroupMembersRequest request)
    {
        return await service.ReplaceMembersAsync(groupId, request, Request.GetIfMatchVersion());
    }

    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    [HttpPost("{groupId}/deactivate")]
    public async Task<object> Deactivate(string groupId, [FromBody] ReasonRequest request)
    {
        return await service.DeactivateAsync(groupId, request, Request.GetIfMatchVersion());
    }

    [RequiresPermission(PermissionFeatures.PermissionsManage)]
    [HttpPost("{groupId}/activate")]
    public async Task<object> Activate(string groupId, [FromBody] ReasonRequest request)
    {
        return await service.ActivateAsync(groupId, request, Request.GetIfMatchVersion());
    }
}
