using Identity.Api.Models.Dtos;
using Identity.Api.Models.Queries;
using Identity.Api.Models.Requests;
using Shared.Commons.Models;

namespace Identity.Api.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserDto>> ListAsync(UserQuery query);
    Task<UserDto> GetAsync(string userId);
    Task<UserDto> CreateAsync(UserCreateRequest request);
    Task<UserDto> UpdateAsync(string userId, UserPatchRequest request, int ifMatchVersion);
    Task<UserDto> LockAsync(string userId, UserLockRequest request, int ifMatchVersion);
    Task<UserDto> UnlockAsync(string userId, ReasonRequest request, int ifMatchVersion);
    Task ResetPasswordAsync(string userId, ResetPasswordRequest request);
    Task RevokeSessionsAsync(string userId, ReasonRequest request);
    Task<List<UserProjectDto>> ListProjectsAsync(string userId);
    Task<ProfileDto> GetProfileAsync(string userId);
    Task<UserPermissionsDto> GetPermissionsAsync(string userId);
    Task<UserPermissionsDto> UpdatePermissionsAsync(string userId, UserPermissionsRequest request, int ifMatchVersion);
}
