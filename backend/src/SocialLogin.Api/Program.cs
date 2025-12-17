using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Scalar.AspNetCore;
using SocialLogin.Api.Endpoints;
using SocialLogin.Application;
using SocialLogin.Infrastructure;
using SocialLogin.Infrastructure.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

var keycloakOptions = builder.Configuration.GetSection(KeycloakOptions.SectionName).Get<KeycloakOptions>()
    ?? throw new InvalidOperationException("Missing Keycloak configuration");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"{keycloakOptions.Authority.TrimEnd('/')}/realms/{keycloakOptions.Realm}";
        if (string.IsNullOrWhiteSpace(keycloakOptions.Audience))
        {
            options.TokenValidationParameters.ValidateAudience = false;
        }
        else
        {
            options.Audience = keycloakOptions.Audience;
        }

        options.RequireHttpsMetadata = false;
    });

builder.Services.AddAuthorization();
builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("AllowedCorsOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});


var app = builder.Build();

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "Social Login API";
    });
}

app.MapAuthEndpoints();
app.MapSocialAuthEndpoints();
app.MapProfileEndpoints();

app.Run();
