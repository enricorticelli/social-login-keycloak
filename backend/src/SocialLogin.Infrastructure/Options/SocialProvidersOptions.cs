namespace SocialLogin.Infrastructure.Options;

public sealed class SocialProvidersOptions
{
    public const string SectionName = "SocialProviders";

    public SocialProviderConfig Google { get; init; } = new();
    public SocialProviderConfig Facebook { get; init; } = new();
}

public sealed class SocialProviderConfig
{
    public string ClientId { get; init; } = string.Empty;
    public string ClientSecret { get; init; } = string.Empty;
}
