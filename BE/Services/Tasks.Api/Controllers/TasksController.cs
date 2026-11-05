using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Controllers;

[Authorize]
[ApiController]
public class TasksController(ILogger<BaseApiController> logger, ITaskService service) : BaseApiController(logger)
{
    [HttpGet("api/tasks")]
    public async Task<object> List([FromQuery] TaskQuery query)
    {
        return await service.ListAsync(query);
    }

    [HttpGet("api/tasks/{taskId}")]
    public async Task<object> Get(string taskId)
    {
        return await service.GetAsync(taskId);
    }

    [HttpPost("api/projects/{projectId}/tasks")]
    public async Task<object> Create(string projectId, [FromBody] CreateTaskRequest request)
    {
        return await service.CreateAsync(projectId, request, ActorId);
    }

    [HttpPatch("api/tasks/{taskId}")]
    public async Task<object> Update(string taskId, [FromBody] UpdateTaskRequest request)
    {
        return await service.UpdateAsync(taskId, request, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/tasks/{taskId}/cancel")]
    public async Task<object> Cancel(string taskId, [FromBody] CancelTaskRequest request)
    {
        return await service.CancelAsync(taskId, request, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/tasks/{taskId}/assignments")]
    public async Task<object> Assign(string taskId, [FromBody] AssignTaskRequest request)
    {
        return await service.AssignAsync(taskId, request, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/tasks/{taskId}/start")]
    public async Task<object> Start(string taskId)
    {
        return await service.StartAsync(taskId, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/tasks/{taskId}/pause")]
    public async Task<object> Pause(string taskId, [FromBody] PauseTaskRequest request)
    {
        return await service.PauseAsync(taskId, request, RequireIfMatch(), ActorId);
    }

    [HttpPatch("api/tasks/{taskId}/remaining-estimate")]
    public async Task<object> UpdateRemainingEstimate(string taskId, [FromBody] UpdateRemainingEstimateRequest request)
    {
        return await service.UpdateRemainingEstimateAsync(taskId, request, RequireIfMatch(), ActorId);
    }

    [HttpGet("api/tasks/{taskId}/history")]
    public async Task<object> History(string taskId, [FromQuery] SimplePagingQuery query)
    {
        return await service.ListHistoryAsync(taskId, query);
    }
}
