using SocialLogin.Application.Contracts;
using SocialLogin.Domain.Models;

namespace SocialLogin.Application.Abstractions;

public interface ISocialAuthService
{
    AuthorizeUrlResult GetAuthorizeUrl(string provider, string redirectUri);
    Task<SocialTokenResult> ExchangeCodeAsync(SocialExchangeCommand command, CancellationToken cancellationToken);
}
