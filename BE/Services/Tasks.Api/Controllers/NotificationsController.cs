using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Models;
using Tasks.Api.Services;

namespace Tasks.Api.Controllers;

[Authorize]
[ApiController]
public class NotificationsController(ILogger<BaseApiController> logger, NotificationService service) : BaseApiController(logger)
{
    [HttpGet("api/notifications")]
    public async Task<object> List([FromQuery] PagingQuery query) => await service.ListAsync(query);

    [HttpGet("api/notifications/summary")]
    public async Task<object> Summary() => await service.SummaryAsync();

    [HttpPatch("api/notifications/{notificationId}")]
    public async Task<object> MarkRead(string notificationId, [FromBody] ReadNotificationRequest request) =>
        await service.MarkReadAsync(notificationId, request);
}
