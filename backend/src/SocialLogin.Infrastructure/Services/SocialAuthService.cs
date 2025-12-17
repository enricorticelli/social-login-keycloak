using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using SocialLogin.Application.Abstractions;
using SocialLogin.Application.Contracts;
using SocialLogin.Domain.Models;
using SocialLogin.Infrastructure.Options;

namespace SocialLogin.Infrastructure.Services;

internal sealed class SocialAuthService : ISocialAuthService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    
    private readonly HttpClient _httpClient;
    private readonly SocialProvidersOptions _options;

    public SocialAuthService(HttpClient httpClient, IOptions<SocialProvidersOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public AuthorizeUrlResult GetAuthorizeUrl(string provider, string redirectUri)
    {
        var config = GetProviderConfig(provider);
        var state = Guid.NewGuid().ToString("N");
        
        var (baseUrl, scope) = provider.ToLowerInvariant() switch
        {
            "google" => ("https://accounts.google.com/o/oauth2/v2/auth", "openid email profile"),
            "facebook" => ("https://www.facebook.com/v19.0/dialog/oauth", "public_profile,email"),
            _ => throw new ArgumentException($"Provider non supportato: {provider}", nameof(provider))
        };

        var queryParams = new Dictionary<string, string>
        {
            ["client_id"] = config.ClientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = scope,
            ["state"] = state
        };

        if (provider.Equals("google", StringComparison.OrdinalIgnoreCase))
        {
            queryParams["access_type"] = "offline";
            queryParams["prompt"] = "consent";
        }

        var queryString = string.Join("&", queryParams.Select(kvp => 
            $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}"));

        return new AuthorizeUrlResult($"{baseUrl}?{queryString}", state);
    }

    public async Task<SocialTokenResult> ExchangeCodeAsync(SocialExchangeCommand command, CancellationToken cancellationToken)
    {
        var config = GetProviderConfig(command.Provider);
        
        var tokenUrl = command.Provider.ToLowerInvariant() switch
        {
            "google" => "https://oauth2.googleapis.com/token",
            "facebook" => "https://graph.facebook.com/v19.0/oauth/access_token",
            _ => throw new ArgumentException($"Provider non supportato: {command.Provider}", nameof(command))
        };

        var formData = new Dictionary<string, string>
        {
            ["client_id"] = config.ClientId,
            ["client_secret"] = config.ClientSecret,
            ["redirect_uri"] = command.RedirectUri,
            ["code"] = command.Code,
            ["grant_type"] = "authorization_code"
        };

        using var content = new FormUrlEncodedContent(formData);
        using var response = await _httpClient.PostAsync(tokenUrl, content, cancellationToken);
        
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorPayload = JsonSerializer.Deserialize<OAuthErrorResponse>(body, SerializerOptions);
            var errorMessage = errorPayload?.ErrorDescription ?? errorPayload?.Error ?? body;
            throw new InvalidOperationException($"Errore durante lo scambio del codice: {errorMessage}");
        }

        var tokenPayload = JsonSerializer.Deserialize<OAuthTokenResponse>(body, SerializerOptions) 
            ?? throw new InvalidOperationException("Impossibile deserializzare la risposta del provider");

        return new SocialTokenResult(
            tokenPayload.AccessToken,
            tokenPayload.TokenType,
            tokenPayload.ExpiresIn,
            tokenPayload.RefreshToken,
            tokenPayload.IdToken,
            tokenPayload.Scope
        );
    }

    private SocialProviderConfig GetProviderConfig(string provider)
    {
        var config = provider.ToLowerInvariant() switch
        {
            "google" => _options.Google,
            "facebook" => _options.Facebook,
            _ => throw new ArgumentException($"Provider non supportato: {provider}", nameof(provider))
        };

        if (string.IsNullOrWhiteSpace(config.ClientId) || string.IsNullOrWhiteSpace(config.ClientSecret))
        {
            throw new InvalidOperationException($"Configurazione mancante per il provider {provider}. Verifica ClientId e ClientSecret in appsettings.");
        }

        return config;
    }

    private sealed record OAuthTokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("token_type")] string? TokenType,
        [property: JsonPropertyName("expires_in")] int? ExpiresIn,
        [property: JsonPropertyName("refresh_token")] string? RefreshToken,
        [property: JsonPropertyName("id_token")] string? IdToken,
        [property: JsonPropertyName("scope")] string? Scope
    );

    private sealed record OAuthErrorResponse(
        [property: JsonPropertyName("error")] string? Error,
        [property: JsonPropertyName("error_description")] string? ErrorDescription
    );
}
