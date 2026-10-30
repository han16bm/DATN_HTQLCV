using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Shared.Commons.Models;

namespace Identity.Api.Interfaces;

public interface IPermissionGroupService
{
    Task<PagedResult<PermissionGroupDto>> ListAsync(PermissionGroupQuery query);
    Task<PermissionGroupDto> GetAsync(string groupId);
    Task<PermissionGroupDto> CreateAsync(PermissionGroupCreateRequest request);
    Task<PermissionGroupDto> UpdateAsync(string groupId, PermissionGroupPatchRequest request, int ifMatchVersion);
    Task<PermissionGroupDto> ReplaceMembersAsync(string groupId, PermissionGroupMembersRequest request, int ifMatchVersion);
    Task<PermissionGroupDto> DeactivateAsync(string groupId, ReasonRequest request, int ifMatchVersion);
}
