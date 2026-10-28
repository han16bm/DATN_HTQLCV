using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasks.Api.Interfaces;
using Tasks.Api.Models.Queries;
using Tasks.Api.Models.Requests;

namespace Tasks.Api.Controllers;

[Authorize]
[ApiController]
public class ReportsController(ILogger<BaseApiController> logger, IReportService service) : BaseApiController(logger)
{
    [HttpGet("api/report-previews")]
    public async Task<object> Preview([FromQuery] ReportPreviewQuery query)
    {
        return await service.GetPreviewAsync(query);
    }

    [HttpGet("api/reports")]
    public async Task<object> List([FromQuery] ReportQuery query)
    {
        return await service.ListAsync(query);
    }

    [HttpGet("api/reports/{reportId}")]
    public async Task<object> Get(string reportId)
    {
        return await service.GetAsync(reportId);
    }

    [HttpPost("api/reports")]
    public async Task<object> CreateDraft([FromBody] CreateReportDraftRequest request)
    {
        return await service.CreateDraftAsync(request, ActorId);
    }

    [HttpPatch("api/reports/{reportId}")]
    public async Task<object> UpdateDraft(string reportId, [FromBody] UpdateReportDraftRequest request)
    {
        return await service.UpdateDraftAsync(reportId, request, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/reports/{reportId}/refresh")]
    public async Task<object> Refresh(string reportId)
    {
        return await service.RefreshDraftAsync(reportId, RequireIfMatch(), ActorId);
    }

    [HttpPost("api/reports/{reportId}/submit")]
    public async Task<object> Submit(string reportId, [FromBody] SubmitReportRequest request)
    {
        return await service.SubmitAsync(reportId, request, RequireIfMatch(), ActorId);
    }
}
