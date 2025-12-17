using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using SocialLogin.Application.Abstractions;
using SocialLogin.Application.Contracts;
using SocialLogin.Domain.Models;

namespace SocialLogin.Api.Endpoints;

internal static class SocialAuthEndpoints
{
    public static IEndpointRouteBuilder MapSocialAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth/social")
            .WithTags("Social Auth");

        group.MapGet("/{provider}/authorize-url", GetAuthorizeUrl)
            .WithName("GetSocialAuthorizeUrl");

        group.MapPost("/{provider}/exchange", ExchangeAsync)
            .WithName("ExchangeSocialCode");

        return app;
    }

    private static Results<BadRequest<ProblemDetails>, Ok<AuthorizeUrlResult>> GetAuthorizeUrl(
        [FromRoute] string provider,
        [FromQuery] string redirectUri,
        ISocialAuthService socialAuthService)
    {
        if (string.IsNullOrWhiteSpace(redirectUri))
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Validation error",
                Detail = "redirectUri è obbligatorio"
            });
        }

        var supportedProviders = new[] { "google", "facebook" };
        if (!supportedProviders.Contains(provider.ToLowerInvariant()))
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Validation error",
                Detail = $"Provider non supportato: {provider}. Usa: {string.Join(", ", supportedProviders)}"
            });
        }

        try
        {
            var result = socialAuthService.GetAuthorizeUrl(provider, redirectUri);
            return TypedResults.Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Configuration error",
                Detail = ex.Message
            });
        }
    }

    private static async Task<Results<BadRequest<ProblemDetails>, Ok<SocialTokenResult>, ProblemHttpResult>> ExchangeAsync(
        [FromRoute] string provider,
        [FromBody] SocialExchangeRequest request,
        ISocialAuthService socialAuthService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Validation error",
                Detail = "code è obbligatorio"
            });
        }

        if (string.IsNullOrWhiteSpace(request.RedirectUri))
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Validation error",
                Detail = "redirectUri è obbligatorio"
            });
        }

        try
        {
            var command = new SocialExchangeCommand(provider, request.Code, request.RedirectUri);
            var result = await socialAuthService.ExchangeCodeAsync(command, cancellationToken);
            return TypedResults.Ok(result);
        }
        catch (ArgumentException ex)
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Validation error",
                Detail = ex.Message
            });
        }
        catch (Exception ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    internal sealed record SocialExchangeRequest(string Code, string RedirectUri);
}
