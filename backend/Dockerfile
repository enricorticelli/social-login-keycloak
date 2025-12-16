FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY social-login-keycloak.sln ./
COPY backend/src/SocialLogin.Domain/SocialLogin.Domain.csproj backend/src/SocialLogin.Domain/
COPY backend/src/SocialLogin.Application/SocialLogin.Application.csproj backend/src/SocialLogin.Application/
COPY backend/src/SocialLogin.Infrastructure/SocialLogin.Infrastructure.csproj backend/src/SocialLogin.Infrastructure/
COPY backend/src/SocialLogin.Api/SocialLogin.Api.csproj backend/src/SocialLogin.Api/

RUN dotnet restore backend/src/SocialLogin.Api/SocialLogin.Api.csproj

COPY backend/src ./backend/src
RUN dotnet publish backend/src/SocialLogin.Api/SocialLogin.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "SocialLogin.Api.dll"]
