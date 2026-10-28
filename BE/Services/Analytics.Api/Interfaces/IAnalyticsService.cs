using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;

namespace Analytics.Api.Interfaces;

public interface IAnalyticsService
{
    Task<DashboardDto> GetDashboardAsync(AnalyticsQuery query);
    Task<List<RiskItemDto>> GetRisksAsync(AnalyticsQuery query);
    Task<List<WorkloadItemDto>> GetWorkloadAsync(AnalyticsQuery query);
    Task<List<BottleneckItemDto>> GetBottlenecksAsync(AnalyticsQuery query);
}
