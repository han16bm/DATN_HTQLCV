using Identity.Api.Extensions;
using Identity.Api.Interfaces;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Entities;
using Shared.Entities.Authorization;

namespace Identity.Api.Controllers;

/// <summary>Cấu hình tập trung (bảng SystemConfigs) — route giữ là /api/settings.</summary>
[Authorize]
[AdminArea]
[RequiresPermission(PermissionFeatures.SettingsManage)]
[ApiController]
[Route("api/settings")]
public class SettingsController(ILogger<BaseApiController> logger, ISystemConfigService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] SystemConfigQuery query)
    {
        return await service.ListAsync(query);
    }

    [HttpPost]
    public async Task<object> Create([FromBody] SystemConfigCreateRequest request)
    {
        return await service.CreateAsync(request);
    }

    [HttpPatch("{id}")]
    public async Task<object> Update(string id, [FromBody] SystemConfigPatchRequest request)
    {
        return await service.UpdateAsync(id, request, Request.GetIfMatchVersion());
    }
}
