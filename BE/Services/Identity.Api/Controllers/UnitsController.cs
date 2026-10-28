using Identity.Api.Extensions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/units")]
public class UnitsController(ILogger<BaseApiController> logger, IUnitService unitService) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] UnitQuery query)
    {
        return await unitService.ListAsync(query);
    }

    [HttpGet("{unitId}")]
    public async Task<object> Get(string unitId)
    {
        return await unitService.GetAsync(unitId);
    }

    [HttpPost]
    public async Task<object> Create([FromBody] UnitCreateRequest request)
    {
        return await unitService.CreateAsync(request);
    }

    [HttpPatch("{unitId}")]
    public async Task<object> Update(string unitId, [FromBody] UnitPatchRequest request)
    {
        return await unitService.UpdateAsync(unitId, request, Request.GetIfMatchVersion());
    }

    [HttpPost("{unitId}/deactivate")]
    public async Task<object> Deactivate(string unitId, [FromBody] ReasonRequest request)
    {
        return await unitService.DeactivateAsync(unitId, request, Request.GetIfMatchVersion());
    }
}
