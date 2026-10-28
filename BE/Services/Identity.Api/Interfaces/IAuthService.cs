using Identity.Api.Models.Dtos;
using Identity.Api.Models.Requests;

namespace Identity.Api.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequest request);
    Task<LoginResponseDto> RefreshAsync(string userId);
    Task<SessionDto> GetSessionAsync(string userId);
}
