using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;

namespace Identity.Api.Interfaces;

public interface IProfileService
{
    Task<PersonalProfileDto> GetProfileAsync(string userId);
    Task<SessionDto> UpdateProfileAsync(string userId, IFormCollection form, int ifMatchVersion);
    Task<ChangePasswordResultDto> ChangePasswordAsync(string userId, ChangePasswordRequest request);
    Task<(Stream Content, string ContentType)> OpenAvatarAsync(string name);
}
