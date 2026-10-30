using Analytics.Api.Filters;
using Analytics.Api.Interfaces;
using Analytics.Api.Models.Queries;
using Analytics.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Attributes;
using Shared.Entities;

namespace Analytics.Api.Controllers;

[Authorize]
[Audit]
[ApiController]
[Route("api/alerts")]
public class AlertsController(ILogger<BaseApiController> logger, IAlertService service) : BaseApiController(logger)
{
    [HttpGet]
    [RequiresPermission(PermissionFeatures.AnalyticsView)]
    public async Task<object> List([FromQuery] AlertQuery query)
    {
        return await service.ListAsync(query);
    }

    [HttpGet("{alertId}")]
    [RequiresPermission(PermissionFeatures.AnalyticsView)]
    public async Task<object> Get(string alertId)
    {
        return await service.GetAsync(alertId);
    }

    [HttpPatch("{alertId}")]
    [RequiresPermission(PermissionFeatures.AlertsManage)]
    public async Task<object> Update(string alertId, [FromBody] UpdateAlertRequest request)
    {
        return await service.UpdateAsync(alertId, request, Request.Headers.IfMatch.FirstOrDefault());
    }
}
