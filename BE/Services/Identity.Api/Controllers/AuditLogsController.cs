using Identity.Api.Interfaces;
using Identity.Api.Models.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Entities;
using Shared.Entities.Authorization;

namespace Identity.Api.Controllers;

[Authorize]
[AdminArea]
[RequiresPermission(PermissionFeatures.AuditView)]
[ApiController]
[Route("api/audit-logs")]
public class AuditLogsController(ILogger<BaseApiController> logger, IAuditLogService service) : BaseApiController(logger)
{
    [HttpGet]
    public async Task<object> List([FromQuery] AuditLogQuery query)
    {
        return await service.ListAsync(query);
    }

    [HttpGet("entity-types")]
    public async Task<object> ListEntityTypes()
    {
        return await service.ListEntityTypesAsync();
    }

    [HttpGet("{id}")]
    public async Task<object> Get(string id)
    {
        return await service.GetAsync(id);
    }
}
