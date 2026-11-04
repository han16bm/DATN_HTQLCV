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
[RequiresPermission(PermissionFeatures.SettingsManage)]
[ApiController]
[Route("api/ip-whitelist")]
public class IpWhitelistController(ILogger<BaseApiController> logger, IIpWhitelistService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> Get()
    {
        return await service.GetAsync();
    }

    [HttpPost]
    public async Task<object> Create([FromBody] IpWhitelistEntryCreateRequest request)
    {
        return await service.CreateAsync(request);
    }

    [HttpPatch("{id}")]
    public async Task<object> Update(string id, [FromBody] IpWhitelistEntryPatchRequest request)
    {
        return await service.UpdateAsync(id, request, Request.GetIfMatchVersion());
    }

    [HttpDelete("{id}")]
    public async Task<object> Delete(string id)
    {
        await service.DeleteAsync(id, Request.GetIfMatchVersion());
        return new { ok = true };
    }
}
