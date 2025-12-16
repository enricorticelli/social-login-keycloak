using SocialLogin.Application.Contracts;
using SocialLogin.Domain.Models;

namespace SocialLogin.Application.Abstractions;

public interface IIdentityProviderClient
{
    Task<TokenResult> ExchangeAsync(TokenExchangeCommand command, CancellationToken cancellationToken);

    Task<TokenResult> RefreshAsync(RefreshCommand command, CancellationToken cancellationToken);

    Task<UserProfile?> GetUserProfileAsync(string accessToken, CancellationToken cancellationToken);
}
