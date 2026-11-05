using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;

namespace Analytics.Api.Interfaces;

public interface IAnalysisService
{
    Task<AnalysisSummaryDto> GetSummaryAsync(AnalyticsQuery query);
    Task<AnalysisDetailDto> GetDetailAsync(string analysisId);
    Task<(AnalysisJobDto Job, bool Finished)> CreateJobAsync(CreateAnalysisJobRequest request);
    Task<AnalysisJobDto> GetJobAsync(string jobId);
    Task<FeedbackDto> CreateFeedbackAsync(string analysisId, CreateAnalysisFeedbackRequest request);
}
