# Keycloak Social Login Demo

End-to-end example of social login without showing the Keycloak UI: the frontend gets a real Google/Facebook token, the backend exchanges it with Keycloak, and you call protected APIs with the resulting tokens.

Full guides:

- 🇬🇧 English: [README.en.md](README.en.md)
- 🇮🇹 Italiano: [README.it.md](README.it.md)

Quick start (Docker Compose):

```bash
docker compose up --build
```

Services: Keycloak `http://localhost:8181`, backend `http://localhost:5188`, frontend `http://localhost:3000`. See the language-specific README for complete setup, credentials, and flow details.
