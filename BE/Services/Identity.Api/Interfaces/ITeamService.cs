using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Shared.Commons.Models;

namespace Identity.Api.Interfaces;

public interface ITeamService
{
    Task<PagedResult<TeamDto>> ListAsync(TeamQuery query);
    Task<TeamDto> GetAsync(string teamId);
    Task<TeamDto> CreateAsync(TeamCreateRequest request);
    Task<TeamDto> UpdateAsync(string teamId, TeamPatchRequest request, int ifMatchVersion);
    Task<TeamDto> ReplaceMembersAsync(string teamId, TeamMembersRequest request, int ifMatchVersion);
    Task<TeamDto> DeactivateAsync(string teamId, ReasonRequest request, int ifMatchVersion);
}
