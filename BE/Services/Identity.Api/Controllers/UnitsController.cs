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
[ApiController]
[Route("api/units")]
public class UnitsController(ILogger<BaseApiController> logger, IUnitService unitService) : BaseApiController(logger)
{
    [RequiresPermission(PermissionFeatures.OrganizationManage, PermissionFeatures.UsersManage)]
    [HttpGet]
    public async Task<object> List([FromQuery] UnitQuery query)
    {
        return await unitService.ListAsync(query);
    }

    [RequiresPermission(PermissionFeatures.OrganizationManage)]
    [HttpGet("{unitId}")]
    public async Task<object> Get(string unitId)
    {
        return await unitService.GetAsync(unitId);
    }

    [RequiresPermission(PermissionFeatures.OrganizationManage)]
    [HttpPost]
    public async Task<object> Create([FromBody] UnitCreateRequest request)
    {
        return await unitService.CreateAsync(request);
    }

    [RequiresPermission(PermissionFeatures.OrganizationManage)]
    [HttpPatch("{unitId}")]
    public async Task<object> Update(string unitId, [FromBody] UnitPatchRequest request)
    {
        return await unitService.UpdateAsync(unitId, request, Request.GetIfMatchVersion());
    }

    [RequiresPermission(PermissionFeatures.OrganizationManage)]
    [HttpPost("{unitId}/deactivate")]
    public async Task<object> Deactivate(string unitId, [FromBody] ReasonRequest request)
    {
        return await unitService.DeactivateAsync(unitId, request, Request.GetIfMatchVersion());
    }
}
