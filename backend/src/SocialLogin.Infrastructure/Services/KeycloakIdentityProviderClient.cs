using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using SocialLogin.Application.Abstractions;
using SocialLogin.Application.Contracts;
using SocialLogin.Domain.Models;
using SocialLogin.Infrastructure.Options;

namespace SocialLogin.Infrastructure.Services;

internal sealed class KeycloakIdentityProviderClient : IIdentityProviderClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient;
    private readonly KeycloakOptions _options;

    public KeycloakIdentityProviderClient(HttpClient httpClient, IOptions<KeycloakOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<TokenResult> ExchangeAsync(TokenExchangeCommand command, CancellationToken cancellationToken)
    {
        using var content = new FormUrlEncodedContent(BuildExchangePayload(command));
        using var response = await _httpClient.PostAsync("protocol/openid-connect/token", content, cancellationToken);
        var payload = await DeserializeAsync<TokenPayload>(response, cancellationToken);
        return payload.ToDomain();
    }

    public async Task<TokenResult> RefreshAsync(RefreshCommand command, CancellationToken cancellationToken)
    {
        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["refresh_token"] = command.RefreshToken
        });

        using var response = await _httpClient.PostAsync("protocol/openid-connect/token", content, cancellationToken);
        var payload = await DeserializeAsync<TokenPayload>(response, cancellationToken);
        return payload.ToDomain();
    }

    public async Task<UserProfile?> GetUserProfileAsync(string accessToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "protocol/openid-connect/userinfo");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException("Userinfo call failed");
        }

        var payload = await response.Content.ReadAsStringAsync(cancellationToken);
        var profile = JsonSerializer.Deserialize<UserInfoPayload>(payload, SerializerOptions);
        return profile?.ToDomain();
    }

    private Dictionary<string, string> BuildExchangePayload(TokenExchangeCommand command)
    {
        var payload = new Dictionary<string, string>
        {
            ["grant_type"] = "urn:ietf:params:oauth:grant-type:token-exchange",
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["subject_token"] = command.SubjectToken,
            ["subject_token_type"] = "urn:ietf:params:oauth:token-type:access_token",
            ["scope"] = "openid profile email offline_access"
        };

        if (!string.IsNullOrWhiteSpace(command.SubjectIssuer))
        {
            payload["subject_issuer"] = command.SubjectIssuer!;
        }

        if (!string.IsNullOrWhiteSpace(_options.Audience))
        {
            payload["audience"] = _options.Audience;
        }

        return payload;
    }

    private static async Task<T> DeserializeAsync<T>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(body);
        }

        return JsonSerializer.Deserialize<T>(body, SerializerOptions) ?? throw new InvalidOperationException("Unable to parse response from identity provider");
    }

    private sealed record TokenPayload(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("refresh_token")] string RefreshToken,
        [property: JsonPropertyName("expires_in")] int ExpiresIn,
        [property: JsonPropertyName("refresh_expires_in")] int RefreshExpiresIn,
        [property: JsonPropertyName("token_type")] string TokenType,
        [property: JsonPropertyName("scope")] string Scope,
        [property: JsonPropertyName("id_token")] string? IdToken)
    {
        public TokenResult ToDomain() => new(AccessToken, RefreshToken, ExpiresIn, RefreshExpiresIn, TokenType, Scope, IdToken);
    }

    private sealed record UserInfoPayload(
        [property: JsonPropertyName("sub")] string Subject,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("preferred_username")] string PreferredUsername,
        [property: JsonPropertyName("name")] string Name)
    {
        public UserProfile ToDomain() => new(Subject, Email, PreferredUsername, Name);
    }
}
