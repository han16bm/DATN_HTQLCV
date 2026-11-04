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
// ANALYTICS_VIEW hệ thống hoặc ở ít nhất một dự án: AnalyticsService giới hạn phạm vi dữ liệu.
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
