# Demo di social login con Keycloak

Esempio end-to-end che realizza un login social **senza** usare l’interfaccia di Keycloak: il frontend ottiene un token reale di Google/Facebook, il backend lo scambia con Keycloak via token-exchange e i token risultanti vengono usati per chiamare API protette.

- **frontend/** – Next.js 14 (App Router) con UI in 3 step: Social login → Token exchange → Chiamate protette.
- **backend/src/SocialLogin.Api** – Minimal API .NET 10 con documentazione via [Scalar](https://github.com/scalar/scalar).
- **backend/src/SocialLogin.Application**, **.Domain**, **.Infrastructure** – separazione clean architecture (contratti, dominio, integrazione Keycloak).
- **keycloak/** – export del realm con i client `social-login-backend`, `social-login-frontend` e IdP social già pronti per il token-exchange (inserisci i tuoi clientId/clientSecret reali).
- **docker-compose.yml** – avvia Keycloak 24 in modalità dev e importa automaticamente il realm.

## Requisiti

- Docker + Docker Compose
- Node.js >= 18 (Next.js 14)
- .NET SDK 10.0+

## Avvio rapido

### Tutto con Docker Compose

```bash
docker compose up --build
```

Parte:
- **Keycloak** su `http://localhost:8181` (admin/admin) con realm `social-demo` importato.
- **Backend .NET** su `http://localhost:5188` con docs Scalar su `/scalar/v1`.
- **Frontend Next.js** su `http://localhost:3000`.

Poi prova il flusso: **Accedi con Google/Facebook** → **Scambia token con Keycloak** → **/profile**. Servono clientId/clientSecret reali per Google/Facebook dentro i container per chiudere il loop live.

### Avvio manuale (sviluppo locale)

1) **Keycloak**
```bash
docker compose up keycloak -d
```
L’istanza è su `http://localhost:8181` con admin `admin/admin`. Il realm `social-demo` viene importato in automatico.

2) **Backend**
```bash
dotnet restore social-login-keycloak.sln
dotnet run --project backend/src/SocialLogin.Api
```
Variabili principali (possono essere impostate da env, es. `Keycloak__ClientSecret`):
- `Keycloak:Authority` es. `http://localhost:8181`
- `Keycloak:Realm` es. `social-demo`
- `Keycloak:ClientId` / `Keycloak:ClientSecret` es. `social-login-backend` / `backend-secret`
- `Keycloak:Audience` es. `social-login-backend`

3) **Frontend**
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Compila i clientId/clientSecret di Google/Facebook come indicato sotto.

4) Apri `http://localhost:3000` e segui i passaggi Social login → Exchange → Chiamate protette. Tutto avviene via fetch -> backend -> Keycloak; l’interfaccia di Keycloak non viene mai mostrata. Docs API: `http://localhost:5188/scalar/v1`.

## Credenziali OAuth (Google / Facebook)

### Google
- https://console.cloud.google.com/apis/credentials → crea **OAuth client** (app web).
- URI di redirect autorizzato: `http://localhost:3000/oauth/callback?provider=google` (più eventuali URL di produzione).
- Inserisci in `.env.local`:
  - `GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (stesso valore)
  - `GOOGLE_CLIENT_SECRET`

### Facebook
- https://developers.facebook.com/ → crea app (tipo **Consumer**) → abilita **Facebook Login**.
- Redirect URI: `http://localhost:3000/oauth/callback?provider=facebook` (più URL di produzione).
- Inserisci in `.env.local`:
  - `FACEBOOK_CLIENT_ID` + `NEXT_PUBLIC_FACEBOOK_CLIENT_ID`
  - `FACEBOOK_CLIENT_SECRET`

Note:
- I `NEXT_PUBLIC_*` sono esposti al browser (solo clientId). I secret restano lato server in `/api/oauth/exchange`.
- Riavvia `npm run dev` dopo le modifiche a `.env.local`.

## Keycloak: token-exchange e permessi IdP

1. Avvia Keycloak con le feature `token-exchange,admin-fine-grained-authz` (già in `docker-compose.yml`).
2. Admin console: `Realm settings -> Admin permissions -> Enable`.
3. Service account del client backend: `Clients -> social-login-backend -> Service account roles`, aggiungi `realm-management -> token-exchange` (già nell’export, verifica).
4. Concedi il permesso di token-exchange sugli Identity Provider:
   - `Identity Providers -> google -> Permissions -> enable -> token-exchange`: aggiungi il client `social-login-backend` (policy basata sul client).
   - Ripeti per `facebook`.
5. Gli alias IdP devono essere esattamente `google` e `facebook` (coincidono con `subject_issuer` inviato dal frontend).

## Dettagli del flusso

1) L’utente sceglie Google/Facebook. Il frontend redirige con `response_type=code` e salva `state` in `sessionStorage`.
2) Il provider torna su `/oauth/callback?provider=...&code=...&state=...`; la page valida `state` e chiama `POST /api/oauth/exchange` per scambiare il `code` con l’access token del provider (server-side, usando il clientSecret).
3) Il frontend invia `provider` + `subjectToken` (token social) + `subjectIssuer` al backend (`POST /auth/exchange`). L’API effettua un token exchange Keycloak (`grant_type=urn:ietf:params:oauth:grant-type:token-exchange`) usando il service account di `social-login-backend` (ruolo `token-exchange` su `realm-management`).
4) Keycloak restituisce `access_token` + `refresh_token` per audience `social-login-backend`; il backend gira il payload al frontend.
5) Il frontend usa l’access token per `/profile` (che chiama `/protocol/openid-connect/userinfo`) e può fare refresh via `POST /auth/refresh`.

## File principali

- `backend/src/SocialLogin.Api/Program.cs` – bootstrap minimal API, CORS, auth, endpoints + Scalar.
- `backend/src/SocialLogin.Api/Endpoints/*.cs` – definizione degli endpoint HTTP.
- `backend/src/SocialLogin.Infrastructure/*` – integrazione Keycloak che implementa `IIdentityProviderClient`.
- `frontend/app/page.tsx` – landing con navigazione veloce del flusso in 3 step.
- `frontend/app/social/page.tsx` – bottoni reali Google/Facebook e acquisizione token.
- `frontend/app/exchange/page.tsx` – scambia il token social con Keycloak.
- `frontend/app/actions/page.tsx` – chiama `/profile` e gestisce il refresh.
- `frontend/app/oauth/callback/page.tsx` – gestisce la callback dell’IdP e salva i token.
- `frontend/app/api/oauth/exchange/route.ts` – route Next che scambia il code per il token del provider usando il client secret.
- `keycloak/realm-social-demo.json` – realm già pronto (utente `demo/demo`, clients, service account).
- `docker-compose.yml` – esegue Keycloak in dev mode con import del realm.

## Test manuali

- `POST http://localhost:5188/auth/exchange` passando un `subjectToken` reale e `subjectIssuer` che coincide con l’alias IdP (`google` / `facebook`).
- `POST http://localhost:5188/auth/refresh` usando il refresh token ricevuto.
- `GET http://localhost:5188/profile` con `Authorization: Bearer <access_token>`.

Così ottieni un flusso completo di social login verso Keycloak via API, senza mai esporre l’UI di Keycloak.
