namespace SocialLogin.Application.Contracts;

public sealed record TokenExchangeCommand(string Provider, string SubjectToken, string? SubjectIssuer);
