using Projects.Api.Models.Dtos;
using Projects.Api.Models.Queries;
using Projects.Api.Models.Requests;
using Shared.Commons.Models;

namespace Projects.Api.Interfaces;

public interface IProjectService
{
    Task<PagedResult<ProjectDto>> ListAsync(ProjectQuery query);
    Task<ProjectDto> GetAsync(string projectId);
    Task<ProjectDto> CreateAsync(ProjectCreateRequest request);
    Task<ProjectDto> UpdateAsync(string projectId, ProjectPatchRequest request);
    Task<ProjectDto> ActivateAsync(string projectId);
    Task<ProjectDto> TransferOwnerAsync(string projectId, TransferOwnerRequest request);
    Task<ClosureChecksDto> GetClosureChecksAsync(string projectId);
    Task<ProjectDto> CompleteAsync(string projectId);
    Task<ProjectDto> CancelAsync(string projectId, CancelProjectRequest request);
    Task<PagedResult<AuditDto>> ListHistoryAsync(string projectId, PagingQuery query);
}
