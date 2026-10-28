using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Controllers;

[Authorize]
[ApiController]
public class TimeLogsController(ILogger<BaseApiController> logger, ITimeLogService service) : BaseApiController(logger)
{
    [HttpGet("api/tasks/{taskId}/time-logs")]
    public async Task<object> List(string taskId, [FromQuery] SimplePagingQuery query)
    {
        return await service.ListAsync(taskId, query);
    }

    [HttpPost("api/tasks/{taskId}/time-logs")]
    public async Task<object> Create(string taskId, [FromBody] CreateTimeLogRequest request)
    {
        return await service.CreateAsync(taskId, request, RequireIfMatch(), ActorId);
    }

    [HttpPatch("api/time-logs/{timeLogId}")]
    public async Task<object> Update(string timeLogId, [FromBody] UpdateTimeLogRequest request)
    {
        return await service.UpdateAsync(timeLogId, request, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/time-logs/{timeLogId}/void")]
    public async Task<object> Void(string timeLogId, [FromBody] VoidTimeLogRequest request)
    {
        return await service.VoidAsync(timeLogId, request, RequireIfMatch(), ActorId);
    }
}
