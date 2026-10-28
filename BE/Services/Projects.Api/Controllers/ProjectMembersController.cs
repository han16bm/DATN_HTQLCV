using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Projects.Api.Interfaces;
using Projects.Api.Models.Queries;
using Projects.Api.Models.Requests;

namespace Projects.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/projects/{projectId}/members")]
public class ProjectMembersController(ILogger<BaseApiController> logger, IProjectMemberService memberService) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List(string projectId, [FromQuery] MembershipQuery query)
    {
        return await memberService.ListAsync(projectId, query);
    }

    [HttpPost]
    public async Task<object> Add(string projectId, [FromBody] MemberCreateRequest request)
    {
        return await memberService.AddAsync(projectId, request);
    }

    [HttpPost("{membershipId}/end")]
    public async Task<object> End(string projectId, string membershipId, [FromBody] EndMembershipRequest request)
    {
        return await memberService.EndAsync(projectId, membershipId, request);
    }

    [HttpPatch("{membershipId}")]
    public async Task<object> UpdateRole(string projectId, string membershipId, [FromBody] MemberRoleRequest request)
    {
        return await memberService.UpdateRoleAsync(projectId, membershipId, request);
    }
}
