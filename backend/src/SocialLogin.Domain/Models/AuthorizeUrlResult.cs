namespace SocialLogin.Domain.Models;

public sealed record AuthorizeUrlResult(
    string AuthorizeUrl,
    string State
);
