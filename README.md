# Demo social login con Keycloak

Questa repo contiene un esempio end-to-end che mostra come implementare un flusso di social login **senza usare il form di Keycloak**, ma solo chiamate API + token exchange.

- **frontend/** – Next.js 14 (App Router) con bottoni reali per Google e Facebook; ottiene il token social e lo scambia con Keycloak
- **backend/src/SocialLogin.Api** – Minimal API .NET 10 che espone gli endpoint ed è documentata tramite [Scalar](https://github.com/scalar/scalar)
- **backend/src/SocialLogin.Application**, **.Domain**, **.Infrastructure** – suddivisione clean architecture (contratti, modello di dominio e integrazione Keycloak)
- **keycloak/** – realm export preconfigurato con i client `social-login-backend`, `social-login-frontend` e IdP social già pronti per token-exchange (usa i tuoi clientId/clientSecret reali)
- **docker-compose.yml** – avvia Keycloak 24 in modalità dev e importa automaticamente il realm

## Requisiti

- Docker + Docker Compose
- Node.js >= 18 (serve per Next.js 14)
- .NET SDK 10.0+

## Avvio rapido

### Tutto con Docker Compose

```bash
docker compose up --build
```

Questo comando avvia:

- **Keycloak** su `http://localhost:8181` (admin/admin) con import automatico del realm `social-demo`
- **Backend .NET** su `http://localhost:5188` con documentazione Scalar su `http://localhost:5188/scalar/v1`
- **Frontend Next.js** su `http://localhost:3000`

Lato frontend/back vengono già propagate le variabili necessarie per parlare con Keycloak e tra i vari container. Premi **Accedi con Google/Facebook** → **Scambia token con Keycloak** → **/profile** per provare il flusso completo (servono clientId/clientSecret reali nei container se vuoi fare il giro vero).

### Avvio manuale (per sviluppo locale)

1. **Keycloak**
   ```bash
   docker compose up keycloak -d
   ```
   L'istanza parte su `http://localhost:8181` con utente admin `admin/admin`. Il realm `social-demo` viene importato automaticamente.

2. **Backend**
   ```bash
   dotnet restore social-login-keycloak.sln
   dotnet run --project backend/src/SocialLogin.Api
   ```
   Variabili principali (possono essere impostate da env, es. `KEYCLOAK__CLIENTSECRET`):
   - `Keycloak:Authority` es. `http://localhost:8181`
   - `Keycloak:Realm` es. `social-demo`
   - `Keycloak:ClientId`/`ClientSecret` es. `social-login-backend` / `backend-secret`
   - `Keycloak:Audience` es. `social-login-backend` (l'audience che vuoi nella `aud` del token)

3. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev
   ```
   Configura i clientId/clientSecret di Google/Facebook come indicato sotto.

4. Apri `http://localhost:3000`, clicca su **Accedi con Google/Facebook**, poi **Scambia token con Keycloak** e infine chiama `/profile`. Il tutto avviene tramite fetch -> backend -> Keycloak, senza mai mostrare l'interfaccia di Keycloak. La documentazione degli endpoint è disponibile all'URL `http://localhost:5188/scalar/v1`.

## Configurazione credenziali OAuth (Google/Facebook)

### Google
- https://console.cloud.google.com/apis/credentials → **Crea credenziali** → **ID client OAuth** (app web).
- URI di reindirizzamento autorizzati: `http://localhost:3000/oauth/callback?provider=google` (e eventuali URL di produzione).
- Copia `client_id` / `client_secret` e mettili in `.env.local`:
  - `GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (stesso valore)
  - `GOOGLE_CLIENT_SECRET`

### Facebook
- https://developers.facebook.com/ → Crea app (tipo **Consumer**) → abilita prodotto **Accesso con Facebook**.
- Imposta redirect OAuth: `http://localhost:3000/oauth/callback?provider=facebook` (e URL di produzione).
- Copia **ID app** / **Chiave segreta app** in `.env.local`:
  - `FACEBOOK_CLIENT_ID` + `NEXT_PUBLIC_FACEBOOK_CLIENT_ID`
  - `FACEBOOK_CLIENT_SECRET`

### Note
- I `NEXT_PUBLIC_*` sono esposti al browser: contengono solo i clientId. I secret restano solo lato server (`/api/oauth/exchange`).
- Riavvia `npm run dev` dopo aver modificato `.env.local`.

## Dettagli del flusso

1. L'utente sceglie Google o Facebook. Il frontend redirige al provider con `response_type=code` e stato salvato in `sessionStorage`.
2. Il provider rimanda a `/oauth/callback?provider=...&code=...&state=...`; la page valida `state` e chiama `POST /api/oauth/exchange` che scambia il `code` per l'access token del provider (server-side, usando clientSecret).
3. Il frontend passa `provider` + `subjectToken` (token social) + `subjectIssuer` al backend (`POST /auth/exchange`). L'API .NET invia a Keycloak un token exchange (`grant_type=urn:ietf:params:oauth:grant-type:token-exchange`) usando il service account del client `social-login-backend`. Il service account possiede il ruolo `token-exchange` sul client `realm-management` (configurato nel realm import).
4. Keycloak risponde con `access_token` + `refresh_token` per l'audience `social-login-backend`. Il backend restituisce il payload al frontend.
5. Il frontend usa l'access token per invocare `/profile` (che chiama `/protocol/openid-connect/userinfo`) e può anche aggiornare i token via `POST /auth/refresh`.

## File importanti

- `backend/src/SocialLogin.Api/Program.cs` – avvio minimal API, CORS, autenticazione e mapping endpoints con Scalar
- `backend/src/SocialLogin.Api/Endpoints/*.cs` – definizione degli endpoint HTTP
- `backend/src/SocialLogin.Application/*` – interfacce/contratti che disaccoppiano il dominio dall'infrastruttura
- `backend/src/SocialLogin.Infrastructure/*` – implementazione di `IIdentityProviderClient` per Keycloak e binding delle opzioni
- `frontend/app/page.tsx` – UI con bottoni Google/Facebook e gestione dello scambio token
- `frontend/app/oauth/callback/page.tsx` – pagina di callback che scambia il code con il token social
- `frontend/app/api/oauth/exchange/route.ts` – route Next che scambia il code con l'access token via client secret
- `backend/Dockerfile`, `frontend/Dockerfile` – immagini per avviare i due servizi via Docker Compose
- `keycloak/realm-social-demo.json` – realm già pronto (utente `demo/demo`, clients, service account)
- `docker-compose.yml` – esegue Keycloak in dev mode con import automatico

## Personalizzazione

- **Agganciare un social reale**: sostituisci la route `/api/mock-social` richiamando l'SDK del provider desiderato. Il token ottenuto va inviato invariato a `/auth/exchange`.
- **Configurare Keycloak**: apri l'admin console su `http://localhost:8181/admin`, vai su `Clients -> social-login-backend -> Service account roles` e assegna eventuali ulteriori permessi (es. limitare i client che possono essere "audience" del token exchange).
- **Distribuire i servizi**: il compose attuale contiene solo Keycloak per semplicità. Puoi aggiungere backend/front come servizi extra oppure deployare ognuno separatamente.

## Test manuali suggeriti

- `POST http://localhost:5188/auth/exchange` con un token valido ottenuto da `/api/mock-social`
- `POST http://localhost:5188/auth/refresh` usando il refresh token ricevuto
- `GET http://localhost:5188/profile` con `Authorization: Bearer <access_token>`

In questo modo hai un ciclo completo di social login via API e token exchange senza mai esporre l'interfaccia predefinita di Keycloak.
