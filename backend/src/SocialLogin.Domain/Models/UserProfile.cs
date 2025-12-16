namespace SocialLogin.Domain.Models;

public sealed record UserProfile(
    string Subject,
    string Email,
    string PreferredUsername,
    string Name);
