using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;

namespace Identity.Api.Interfaces;

public interface IProfileService
{
    Task<SessionDto> UpdateProfileAsync(string userId, ProfileUpdateForm form, int ifMatchVersion);
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request);
    Task<(Stream Content, string ContentType)> OpenAvatarAsync(string name);
}
