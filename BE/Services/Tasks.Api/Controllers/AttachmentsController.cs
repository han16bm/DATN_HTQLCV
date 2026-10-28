using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasks.Api.Interfaces;

namespace Tasks.Api.Controllers;

[Authorize]
[ApiController]
public class AttachmentsController(ILogger<BaseApiController> logger, IAttachmentService service) : BaseApiController(logger)
{
    [HttpGet("api/attachments/policy")]
    public object UploadPolicy()
    {
        return service.GetUploadPolicy();
    }

    [HttpPost("api/attachments")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<object> Upload([FromForm] string taskId, [FromForm] IFormFile file)
    {
        return await service.UploadAsync(taskId, file, ActorId);
    }

    [HttpGet("api/attachments/{attachmentId}")]
    public async Task<object> Get(string attachmentId)
    {
        return await service.GetAsync(attachmentId, ActorId);
    }

    [HttpGet("api/attachments/{attachmentId}/content")]
    public async Task<IActionResult> Download(string attachmentId)
    {
        var (content, mimeType, filename) = await service.DownloadAsync(attachmentId, ActorId);
        return File(content, mimeType, filename);
    }
}
