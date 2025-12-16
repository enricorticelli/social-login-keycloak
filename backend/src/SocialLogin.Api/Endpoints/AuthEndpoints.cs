using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using SocialLogin.Application.Abstractions;
using SocialLogin.Application.Contracts;
using SocialLogin.Domain.Models;

namespace SocialLogin.Api.Endpoints;

internal static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth")
            .WithTags("Auth");

        group.MapPost("/exchange", ExchangeAsync)
            .WithName("ExchangeToken");

        group.MapPost("/refresh", RefreshAsync)
            .WithName("RefreshToken");

        return app;
    }

    private static async Task<Results<BadRequest<ProblemDetails>, Ok<TokenResult>, ProblemHttpResult>> ExchangeAsync(
        [FromBody] TokenExchangeCommand command,
        IIdentityProviderClient identityProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.SubjectToken))
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Validation error",
                Detail = "subjectToken is required"
            });
        }

        try
        {
            var response = await identityProvider.ExchangeAsync(command, cancellationToken);
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    private static async Task<Results<BadRequest<ProblemDetails>, Ok<TokenResult>, ProblemHttpResult>> RefreshAsync(
        [FromBody] RefreshCommand command,
        IIdentityProviderClient identityProvider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.RefreshToken))
        {
            return TypedResults.BadRequest(new ProblemDetails
            {
                Title = "Validation error",
                Detail = "refreshToken is required"
            });
        }

        try
        {
            var response = await identityProvider.RefreshAsync(command, cancellationToken);
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }
}
