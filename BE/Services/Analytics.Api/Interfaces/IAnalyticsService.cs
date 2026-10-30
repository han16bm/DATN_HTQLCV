using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Shared.Commons.Models;

namespace Analytics.Api.Interfaces;

public interface IAnalyticsService
{
    Task<DashboardDto> GetDashboardAsync(AnalyticsQuery query);
    Task<RisksDto> GetRisksAsync(AnalyticsQuery query);
    Task<WorkloadDto> GetWorkloadAsync(AnalyticsQuery query);
    Task<BottlenecksDto> GetBottlenecksAsync(AnalyticsQuery query);
    Task<PagedResult<EntityLabelDto>> ListFilterOptionsAsync(FilterOptionsQuery query);
}
