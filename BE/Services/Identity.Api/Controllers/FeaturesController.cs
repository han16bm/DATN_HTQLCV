using Identity.Api.Extensions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Entities;
using Shared.Entities.Authorization;

namespace Identity.Api.Controllers;

[Authorize]
[AdminArea]
[RequiresPermission(PermissionFeatures.PermissionsManage)]
[ApiController]
[Route("api/features")]
public class FeaturesController(ILogger<BaseApiController> logger, IFeatureService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List()
    {
        return await service.ListAsync();
    }

    [HttpPatch("{code}")]
    public async Task<object> Update(string code, [FromBody] FeaturePatchRequest request)
    {
        return await service.UpdateAsync(code, request, Request.GetIfMatchVersion());
    }
}
