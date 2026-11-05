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
[RequiresPermission(PermissionFeatures.SettingsManage)]
[ApiController]
[Route("api/ip-access-logs")]
public class IpAccessLogsController(ILogger<BaseApiController> logger, IIpAccessLogService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] IpAccessLogQuery query)
    {
        return await service.ListAsync(query);
    }

    [HttpPost("{id}/allow")]
    public async Task<object> Allow(string id, [FromBody] IpAccessLogAllowRequest request)
    {
        return await service.AllowAsync(id, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{id}/dismiss")]
    public async Task<object> Dismiss(string id, [FromBody] IpAccessLogDismissRequest request)
    {
        return await service.DismissAsync(id, request, Request.GetIfMatchVersion());
    }
}
