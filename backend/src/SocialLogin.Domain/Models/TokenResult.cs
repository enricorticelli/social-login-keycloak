namespace SocialLogin.Domain.Models;

public sealed record TokenResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    int RefreshExpiresIn,
    string TokenType,
    string Scope,
    string? IdToken);
