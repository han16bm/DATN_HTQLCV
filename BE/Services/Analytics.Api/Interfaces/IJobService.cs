using Analytics.Api.Models.Dtos;
using Analytics.Api.Models.Queries;
using Analytics.Api.Models.Requests;
using Shared.Commons.Models;

namespace Analytics.Api.Interfaces;

public interface IJobService
{
    Task<List<BackgroundJobDto>> ListAsync();
    Task<BackgroundJobDto> UpdateAsync(string code, BackgroundJobPatchRequest request);
    Task<JobRunDto> RunNowAsync(string code);
    Task<PagedResult<JobRunDto>> ListRunsAsync(string code, JobRunQuery query);
    Task EnsureJobsAsync(CancellationToken cancellationToken);
    Task RunDueJobsAsync(CancellationToken cancellationToken);
}
