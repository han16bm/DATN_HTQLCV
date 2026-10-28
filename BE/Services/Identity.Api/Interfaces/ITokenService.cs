using Shared.Entities.Entities;

namespace Identity.Api.Interfaces;

public interface ITokenService
{
    (string AccessToken, DateTime ExpiresAt) CreateAccessToken(User user);
}
