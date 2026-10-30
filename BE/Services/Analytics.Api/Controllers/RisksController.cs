using Analytics.Api.Filters;
using Analytics.Api.Interfaces;
using Analytics.Api.Models.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Attributes;
using Shared.Entities;

namespace Analytics.Api.Controllers;

[Authorize]
[Audit]
[RequiresPermission(PermissionFeatures.AnalyticsView)]
[ApiController]
[Route("api/analytics/risks")]
public class RisksController(ILogger<BaseApiController> logger, IAnalyticsService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> Get([FromQuery] AnalyticsQuery query)
    {
        return await service.GetRisksAsync(query);
    }
}
