using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Projects.Api.Interfaces;
using Projects.Api.Models.Queries;
using Projects.Api.Models.Requests;
using Shared.Commons.Models;

namespace Projects.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/projects")]
public class ProjectsController(ILogger<BaseApiController> logger, IProjectService projectService) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] ProjectQuery query)
    {
        return await projectService.ListAsync(query);
    }

    [HttpGet("{projectId}")]
    public async Task<object> Get(string projectId)
    {
        return await projectService.GetAsync(projectId);
    }

    [HttpPost]
    public async Task<object> Create([FromBody] ProjectCreateRequest request)
    {
        return await projectService.CreateAsync(request);
    }

    [HttpPatch("{projectId}")]
    public async Task<object> Update(string projectId, [FromBody] ProjectPatchRequest request)
    {
        return await projectService.UpdateAsync(projectId, request);
    }

    [HttpPost("{projectId}/activate")]
    public async Task<object> Activate(string projectId)
    {
        return await projectService.ActivateAsync(projectId);
    }

    [HttpGet("{projectId}/closure-checks")]
    public async Task<object> GetClosureChecks(string projectId)
    {
        return await projectService.GetClosureChecksAsync(projectId);
    }

    [HttpPost("{projectId}/complete")]
    public async Task<object> Complete(string projectId)
    {
        return await projectService.CompleteAsync(projectId);
    }

    [HttpPost("{projectId}/cancel")]
    public async Task<object> Cancel(string projectId, [FromBody] CancelProjectRequest request)
    {
        return await projectService.CancelAsync(projectId, request);
    }

    [HttpGet("{projectId}/history")]
    public async Task<object> ListHistory(string projectId, [FromQuery] PagingQuery query)
    {
        return await projectService.ListHistoryAsync(projectId, query);
    }
}
