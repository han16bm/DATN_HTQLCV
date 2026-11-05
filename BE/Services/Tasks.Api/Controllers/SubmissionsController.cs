using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Controllers;

[Authorize]
[ApiController]
public class SubmissionsController(ILogger<BaseApiController> logger, ISubmissionService service) : BaseApiController(logger)
{
    [HttpGet("api/tasks/{taskId}/submissions")]
    public async Task<object> List(string taskId, [FromQuery] SimplePagingQuery query)
    {
        return await service.ListAsync(taskId, query);
    }

    [HttpGet("api/tasks/{taskId}/submissions/{submissionId}")]
    public async Task<object> Get(string taskId, string submissionId)
    {
        return await service.GetAsync(taskId, submissionId);
    }

    [HttpPost("api/tasks/{taskId}/submissions")]
    public async Task<object> Create(string taskId, [FromBody] CreateSubmissionRequest request)
    {
        return await service.CreateAsync(taskId, request, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/tasks/{taskId}/submissions/{submissionId}/approve")]
    public async Task<object> Approve(string taskId, string submissionId, [FromBody] ApproveSubmissionRequest request)
    {
        return await service.ApproveAsync(taskId, submissionId, request, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/tasks/{taskId}/submissions/{submissionId}/request-revision")]
    public async Task<object> RequestRevision(string taskId, string submissionId, [FromBody] RequestSubmissionRevisionRequest request)
    {
        return await service.RequestRevisionAsync(taskId, submissionId, request, RequireIfMatch(), ActorId);
    }

    [HttpGet("api/review-queue")]
    public async Task<object> ReviewQueue([FromQuery] ReviewQueueQuery query)
    {
        return await service.ListReviewQueueAsync(query);
    }
}
