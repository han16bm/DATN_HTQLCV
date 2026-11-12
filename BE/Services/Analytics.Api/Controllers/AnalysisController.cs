using Analytics.Api.Interfaces;
using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Commons.Attributes;

namespace Analytics.Api.Controllers;

/// <summary>Tổng hợp, chi tiết phân tích, job diễn giải và phản hồi — quyền theo phạm vi dự án của bản chụp.</summary>
[Authorize]
[Audit]
[ApiController]
[Route("api/analytics")]
public class AnalysisController(ILogger<BaseApiController> logger, IAnalysisService service) : BaseApiController(logger)
{
    [HttpGet("summary")]
    public async Task<object> Summary([FromQuery] AnalyticsQuery query)
    {
        return await service.GetSummaryAsync(query);
    }

    [HttpGet("details/{analysisId}")]
    public async Task<object> Detail(string analysisId)
    {
        return await service.GetDetailAsync(analysisId);
    }

    [HttpPost("details/{analysisId}/feedback")]
    public async Task<IActionResult> Feedback(string analysisId, [FromBody] CreateAnalysisFeedbackRequest request)
    {
        return StatusCode(StatusCodes.Status201Created, await service.CreateFeedbackAsync(analysisId, request));
    }

    [HttpPut("details/{analysisId}/explanation-rating")]
    public async Task<object> RateExplanation(string analysisId, [FromBody] RateExplanationRequest request)
    {
        return await service.RateExplanationAsync(analysisId, request);
    }

    [HttpPost("jobs")]
    public async Task<IActionResult> CreateJob([FromBody] CreateAnalysisJobRequest request)
    {
        var (job, finished) = await service.CreateJobAsync(request);
        return StatusCode(finished ? StatusCodes.Status200OK : StatusCodes.Status202Accepted, job);
    }

    [HttpGet("jobs/{jobId}")]
    public async Task<object> Job(string jobId)
    {
        return await service.GetJobAsync(jobId);
    }
}
