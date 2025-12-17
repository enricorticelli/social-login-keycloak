namespace SocialLogin.Domain.Models;

public sealed record SocialTokenResult(
    string AccessToken,
    string? TokenType,
    int? ExpiresIn,
    string? RefreshToken,
    string? IdToken,
    string? Scope
);
