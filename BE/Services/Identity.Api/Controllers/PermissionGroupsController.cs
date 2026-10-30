using Identity.Api.Extensions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/permission-groups")]
public class PermissionGroupsController(ILogger<BaseApiController> logger, IPermissionGroupService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] PermissionGroupQuery query)
    {
        return await service.ListAsync(query);
    }

    [HttpGet("{groupId}")]
    public async Task<object> Get(string groupId)
    {
        return await service.GetAsync(groupId);
    }

    [HttpPost]
    public async Task<object> Create([FromBody] PermissionGroupCreateRequest request)
    {
        return await service.CreateAsync(request);
    }

    [HttpPatch("{groupId}")]
    public async Task<object> Update(string groupId, [FromBody] PermissionGroupPatchRequest request)
    {
        return await service.UpdateAsync(groupId, request, Request.GetIfMatchVersion());
    }

    [HttpPut("{groupId}/members")]
    public async Task<object> ReplaceMembers(string groupId, [FromBody] PermissionGroupMembersRequest request)
    {
        return await service.ReplaceMembersAsync(groupId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{groupId}/deactivate")]
    public async Task<object> Deactivate(string groupId, [FromBody] ReasonRequest request)
    {
        return await service.DeactivateAsync(groupId, request, Request.GetIfMatchVersion());
    }
}
