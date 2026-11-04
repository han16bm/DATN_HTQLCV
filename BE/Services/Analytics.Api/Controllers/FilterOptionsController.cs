using Shared.Entities.Authorization;
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
[Route("api/analytics/filter-options")]
public class FilterOptionsController(ILogger<BaseApiController> logger, IAnalyticsService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] FilterOptionsQuery query)
    {
        return await service.ListFilterOptionsAsync(query);
    }
}
