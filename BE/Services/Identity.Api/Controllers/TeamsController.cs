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
[RequiresPermission(PermissionFeatures.OrganizationManage)]
[ApiController]
[Route("api/teams")]
public class TeamsController(ILogger<BaseApiController> logger, ITeamService teamService) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] TeamQuery query)
    {
        return await teamService.ListAsync(query);
    }

    [HttpGet("{teamId}")]
    public async Task<object> Get(string teamId)
    {
        return await teamService.GetAsync(teamId);
    }

    [HttpPost]
    public async Task<object> Create([FromBody] TeamCreateRequest request)
    {
        return await teamService.CreateAsync(request);
    }

    [HttpPatch("{teamId}")]
    public async Task<object> Update(string teamId, [FromBody] TeamPatchRequest request)
    {
        return await teamService.UpdateAsync(teamId, request, Request.GetIfMatchVersion());
    }

    [HttpPut("{teamId}/members")]
    public async Task<object> ReplaceMembers(string teamId, [FromBody] TeamMembersRequest request)
    {
        return await teamService.ReplaceMembersAsync(teamId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{teamId}/deactivate")]
    public async Task<object> Deactivate(string teamId, [FromBody] ReasonRequest request)
    {
        return await teamService.DeactivateAsync(teamId, request, Request.GetIfMatchVersion());
    }
}
