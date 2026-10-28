using Analytics.Api.Interfaces;
using Analytics.Api.Models.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Attributes;

namespace Analytics.Api.Controllers;

[Authorize]
[Audit]
[ApiController]
[Route("api/analytics/bottlenecks")]
public class BottlenecksController(ILogger<BaseApiController> logger, IAnalyticsService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> Get([FromQuery] AnalyticsQuery query)
    {
        return await service.GetBottlenecksAsync(query);
    }
}
