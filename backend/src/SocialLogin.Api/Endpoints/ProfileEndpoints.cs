using Microsoft.AspNetCore.Http.HttpResults;
using SocialLogin.Application.Abstractions;
using SocialLogin.Domain.Models;

namespace SocialLogin.Api.Endpoints;

internal static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/profile", GetProfileAsync)
            .RequireAuthorization()
            .WithName("GetProfile")
            .WithTags("Profile");

        return app;
    }

    private static async Task<Results<UnauthorizedHttpResult, Ok<UserProfile>, ProblemHttpResult>> GetProfileAsync(
        HttpContext httpContext,
        IIdentityProviderClient identityProvider,
        CancellationToken cancellationToken)
    {
        var accessToken = httpContext.Request.Headers.Authorization
            .FirstOrDefault()
            ?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .LastOrDefault();

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return TypedResults.Unauthorized();
        }

        try
        {
            var profile = await identityProvider.GetUserProfileAsync(accessToken, cancellationToken);
            if (profile is null)
            {
                return TypedResults.Problem("Unable to read profile", statusCode: StatusCodes.Status502BadGateway);
            }

            return TypedResults.Ok(profile);
        }
        catch (Exception ex)
        {
            return TypedResults.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }
}
