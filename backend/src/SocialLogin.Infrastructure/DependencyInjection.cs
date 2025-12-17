using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SocialLogin.Application.Abstractions;
using SocialLogin.Infrastructure.Options;
using SocialLogin.Infrastructure.Services;

namespace SocialLogin.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<KeycloakOptions>(configuration.GetSection(KeycloakOptions.SectionName));
        services.Configure<SocialProvidersOptions>(configuration.GetSection(SocialProvidersOptions.SectionName));

        services.AddHttpClient<IIdentityProviderClient, KeycloakIdentityProviderClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<KeycloakOptions>>().Value;
            if (string.IsNullOrWhiteSpace(options.Authority))
            {
                throw new InvalidOperationException("Keycloak Authority non configurato");
            }

            if (string.IsNullOrWhiteSpace(options.Realm))
            {
                throw new InvalidOperationException("Keycloak Realm non configurato");
            }

            var normalizedRealm = options.Realm.Trim('/'); // evita doppie slash se arriva con leading slash
            client.BaseAddress = new Uri($"{options.Authority.TrimEnd('/')}/realms/{normalizedRealm}/");
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        });

        services.AddHttpClient<ISocialAuthService, SocialAuthService>();

        return services;
    }
}
