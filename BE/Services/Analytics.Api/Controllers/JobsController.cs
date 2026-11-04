using Analytics.Api.Interfaces;
using Analytics.Api.Models.Queries;
using Analytics.Api.Models.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Entities;
using Shared.Entities.Authorization;

namespace Analytics.Api.Controllers;

[Authorize]
[AdminArea]
[RequiresPermission(PermissionFeatures.JobsManage)]
[ApiController]
[Route("api/jobs")]
public class JobsController(ILogger<BaseApiController> logger, IJobService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List()
    {
        return await service.ListAsync();
    }

    [HttpPatch("{code}")]
    public async Task<object> Update(string code, [FromBody] BackgroundJobPatchRequest request)
    {
        return await service.UpdateAsync(code, request);
    }

    [HttpPost("{code}/run")]
    public async Task<object> Run(string code)
    {
        return await service.RunNowAsync(code);
    }

    [HttpGet("{code}/runs")]
    public async Task<object> ListRuns(string code, [FromQuery] JobRunQuery query)
    {
        return await service.ListRunsAsync(code, query);
    }
}
