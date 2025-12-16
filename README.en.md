# Keycloak Social Login Demo

End-to-end example that performs social login **without** using the Keycloak UI: the frontend gets a real Google/Facebook token, the backend exchanges it with Keycloak via token-exchange, and the resulting tokens are used to call protected APIs.

- **frontend/** – Next.js 14 (App Router) with a 3-step UI: Social login → Token exchange → Protected calls.
- **backend/src/SocialLogin.Api** – .NET 10 minimal API exposing endpoints and documented via [Scalar](https://github.com/scalar/scalar).
- **backend/src/SocialLogin.Application**, **.Domain**, **.Infrastructure** – clean-architecture split (contracts, domain model, Keycloak integration).
- **keycloak/** – realm export with clients `social-login-backend`, `social-login-frontend` and social IdPs ready for token-exchange (use your real clientId/clientSecret).
- **docker-compose.yml** – starts Keycloak 24 in dev mode and imports the realm automatically.

## Requirements

- Docker + Docker Compose
- Node.js >= 18 (Next.js 14)
- .NET SDK 10.0+

## Quick start

### All with Docker Compose

```bash
docker compose up --build
```

This spins up:
- **Keycloak** at `http://localhost:8181` (admin/admin) with realm `social-demo` imported.
- **Backend .NET** at `http://localhost:5188` with Scalar docs at `/scalar/v1`.
- **Frontend Next.js** at `http://localhost:3000`.

Then try the flow: **Accedi con Google/Facebook** → **Scambia token con Keycloak** → **/profile**. Use real clientId/clientSecret values for Google/Facebook inside the containers to complete the live loop.

### Manual run (local dev)

1) **Keycloak**
```bash
docker compose up keycloak -d
```
Runs at `http://localhost:8181` with admin `admin/admin`. Realm `social-demo` is imported automatically.

2) **Backend**
```bash
dotnet restore social-login-keycloak.sln
dotnet run --project backend/src/SocialLogin.Api
```
Key variables (can be set via env, e.g., `Keycloak__ClientSecret`):
- `Keycloak:Authority` e.g., `http://localhost:8181`
- `Keycloak:Realm` e.g., `social-demo`
- `Keycloak:ClientId` / `Keycloak:ClientSecret` e.g., `social-login-backend` / `backend-secret`
- `Keycloak:Audience` e.g., `social-login-backend`

3) **Frontend**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Fill Google/Facebook clientId/clientSecret as shown below.

4) Open `http://localhost:3000` and follow Social login → Exchange → Protected calls. Everything goes through fetch -> backend -> Keycloak; the Keycloak UI never appears. API docs: `http://localhost:5188/scalar/v1`.

## OAuth credentials (Google / Facebook)

### Google
- https://console.cloud.google.com/apis/credentials → create **OAuth client** (web app).
- Authorized redirect URI: `http://localhost:3000/oauth/callback?provider=google` (plus any production URLs).
- Set in `.env.local`:
  - `GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (same value)
  - `GOOGLE_CLIENT_SECRET`

### Facebook
- https://developers.facebook.com/ → create app (type **Consumer**) → enable **Facebook Login**.
- Redirect URI: `http://localhost:3000/oauth/callback?provider=facebook` (plus production URLs).
- Set in `.env.local`:
  - `FACEBOOK_CLIENT_ID` + `NEXT_PUBLIC_FACEBOOK_CLIENT_ID`
  - `FACEBOOK_CLIENT_SECRET`

Notes:
- `NEXT_PUBLIC_*` values are exposed to the browser (clientId only). Secrets stay server-side in `/api/oauth/exchange`.
- Restart `npm run dev` after changes to `.env.local`.

## Keycloak: token-exchange and IdP permissions

1. Start Keycloak with `token-exchange,admin-fine-grained-authz` (already in `docker-compose.yml`).
2. Admin console: `Realm settings -> Admin permissions -> Enable`.
3. Backend client service account: `Clients -> social-login-backend -> Service account roles`, add `realm-management -> token-exchange` (already in export, verify).
4. Grant token-exchange permission on Identity Providers:
   - `Identity Providers -> google -> Permissions -> enable -> token-exchange`: add client `social-login-backend` (client-based policy).
   - Repeat for `facebook`.
5. IdP aliases must be exactly `google` and `facebook` (match the `subject_issuer` sent from the frontend).

## Flow details

1) User chooses Google/Facebook. Frontend redirects with `response_type=code` and saves `state` in sessionStorage.
2) Provider returns to `/oauth/callback?provider=...&code=...&state=...`; the page validates `state` and calls `POST /api/oauth/exchange` to trade the `code` for the provider access token (server-side, using the clientSecret).
3) Frontend sends `provider` + `subjectToken` (social token) + `subjectIssuer` to the backend (`POST /auth/exchange`). The API performs a Keycloak token exchange (`grant_type=urn:ietf:params:oauth:grant-type:token-exchange`) using the service account of `social-login-backend` (role `token-exchange` on `realm-management`).
4) Keycloak returns `access_token` + `refresh_token` for audience `social-login-backend`; the backend relays the payload to the frontend.
5) The frontend uses the access token for `/profile` (calling `/protocol/openid-connect/userinfo`) and can refresh via `POST /auth/refresh`.

## Key files

- `backend/src/SocialLogin.Api/Program.cs` – bootstrap minimal API, CORS, auth, endpoints + Scalar.
- `backend/src/SocialLogin.Api/Endpoints/*.cs` – HTTP endpoint definitions.
- `backend/src/SocialLogin.Infrastructure/*` – Keycloak integration implementing `IIdentityProviderClient`.
- `frontend/app/page.tsx` – landing with quick navigation of the 3 steps.
- `frontend/app/social/page.tsx` – real Google/Facebook buttons and token capture.
- `frontend/app/exchange/page.tsx` – exchange the social token with Keycloak.
- `frontend/app/actions/page.tsx` – call `/profile` and handle refresh.
- `frontend/app/oauth/callback/page.tsx` – handles IdP callback and saves tokens.
- `frontend/app/api/oauth/exchange/route.ts` – Next route to swap code for provider token using the client secret.
- `keycloak/realm-social-demo.json` – realm ready to go (user `demo/demo`, clients, service account).
- `docker-compose.yml` – runs Keycloak in dev mode with realm import.

## Manual tests

- `POST http://localhost:5188/auth/exchange` with a real `subjectToken` and `subjectIssuer` matching the IdP alias (`google` / `facebook`).
- `POST http://localhost:5188/auth/refresh` using the received refresh token.
- `GET http://localhost:5188/profile` with `Authorization: Bearer <access_token>`.

This gives you a full social login flow to Keycloak via APIs, without ever exposing the Keycloak UI.
