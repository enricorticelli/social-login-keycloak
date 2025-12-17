namespace SocialLogin.Application.Contracts;

public sealed record SocialExchangeCommand(
    string Provider,
    string Code,
    string RedirectUri
);
