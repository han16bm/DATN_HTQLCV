using Projects.Api.Models.Dtos;
using Projects.Api.Models.Queries;
using Projects.Api.Models.Requests;
using Shared.Commons.Models;

namespace Projects.Api.Interfaces;

public interface IProjectMemberService
{
    Task<PagedResult<MembershipDto>> ListAsync(string projectId, MembershipQuery query);
    Task<MembershipDto> AddAsync(string projectId, MemberCreateRequest request);
    Task<MembershipDto> EndAsync(string projectId, string membershipId, EndMembershipRequest request);
    Task<MembershipDto> UpdateRoleAsync(string projectId, string membershipId, MemberRoleRequest request);
}
