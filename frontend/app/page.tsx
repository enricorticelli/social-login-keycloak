"use client";

import { useEffect, useMemo, useState } from "react";

type Provider = "google" | "facebook";

type ProviderToken = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  id_token?: string;
  scope?: string;
};

type SocialToken = {
  provider: Provider;
  token: ProviderToken;
};

type TokenPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
  id_token?: string;
  scope?: string;
};

type ProfilePayload = {
  sub: string;
  email: string;
  preferred_username: string;
  name: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5188";
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const facebookClientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID ?? "";

const providerLabel: Record<Provider, string> = {
  google: "Google",
  facebook: "Facebook"
};

export default function HomePage() {
  const [socialToken, setSocialToken] = useState<SocialToken | null>(null);
  const [keycloakTokens, setKeycloakTokens] = useState<TokenPayload | null>(null);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("socialToken") : null;
    if (!stored) {
      return;
    }

    try {
      const payload = JSON.parse(stored) as SocialToken;
      setSocialToken(payload);
    } catch {
      // ignore malformed values
    } finally {
      sessionStorage.removeItem("socialToken");
    }
  }, []);

  useEffect(() => {
    if (socialToken) {
      setKeycloakTokens(null);
      setProfile(null);
    }
  }, [socialToken]);

  const redirectUriBase = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/oauth/callback`;
  }, []);

  const startSocialLogin = (provider: Provider) => {
    setError("");
    const clientId = provider === "google" ? googleClientId : facebookClientId;
    if (!clientId) {
      setError(`Config mancante per ${providerLabel[provider]} (imposta NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID).`);
      return;
    }

    const redirectUri = `${redirectUriBase}?provider=${provider}`;
    const state = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
    const baseAuthUrl = provider === "google"
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : "https://www.facebook.com/v19.0/dialog/oauth";
    const scope = provider === "google" ? "openid email profile" : "public_profile,email";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      state
    });

    if (provider === "google") {
      params.set("access_type", "offline");
      params.set("prompt", "consent");
    }

    sessionStorage.setItem(`oauth_state_${provider}`, state);
    window.location.href = `${baseAuthUrl}?${params.toString()}`;
  };

  const exchangeWithKeycloak = async () => {
    if (!socialToken?.token?.access_token) {
      setError("Completa prima il login con Google o Facebook.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/auth/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider: socialToken.provider,
          subjectToken: socialToken.token.access_token,
          subjectIssuer: socialToken.provider
        })
      });
      const payload = (await response.json().catch(() => ({}))) as TokenPayload;
      if (!response.ok) {
        throw new Error((payload as { detail?: string }).detail ?? "Keycloak ha rifiutato il token");
      }
      setKeycloakTokens(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    if (!keycloakTokens?.access_token) {
      setError("Nessun access token disponibile");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/profile`, {
        headers: {
          Authorization: `Bearer ${keycloakTokens.access_token}`
        }
      });
      if (!response.ok) {
        throw new Error("Impossibile leggere il profilo");
      }
      const payload = (await response.json()) as ProfilePayload;
      setProfile(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!keycloakTokens?.refresh_token) {
      setError("Nessun refresh token disponibile");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken: keycloakTokens.refresh_token })
      });
      const payload = (await response.json().catch(() => ({}))) as TokenPayload;
      if (!response.ok) {
        throw new Error("Refresh fallito");
      }
      setKeycloakTokens(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setSocialToken(null);
    setKeycloakTokens(null);
    setProfile(null);
    sessionStorage.removeItem("socialToken");
  };

  return (
    <main>
      <h1>Login social reale + Keycloak</h1>
      <p>Usa Google o Facebook per ottenere il token reale, poi scambialo con Keycloak (token-exchange con subject_issuer impostato sull&apos;alias IdP).</p>

      <section>
        <h2>1. Scegli il provider social</h2>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <button onClick={() => startSocialLogin("google")} disabled={loading}>
            Accedi con Google
          </button>
          <button onClick={() => startSocialLogin("facebook")} disabled={loading}>
            Accedi con Facebook
          </button>
          <button onClick={resetFlow} disabled={loading}>
            Reset
          </button>
        </div>
        {socialToken?.token?.access_token && (
          <div>
            <p>Token ottenuto da {providerLabel[socialToken.provider]}:</p>
            <pre>{socialToken.token.access_token}</pre>
          </div>
        )}
      </section>

      <section>
        <h2>2. Token exchange su Keycloak</h2>
        <button onClick={exchangeWithKeycloak} disabled={loading || !socialToken?.token?.access_token}>
          Scambia token con Keycloak
        </button>
        {keycloakTokens && (
          <pre>{JSON.stringify(keycloakTokens, null, 2)}</pre>
        )}
      </section>

      <section>
        <h2>3. Chiamate API protette</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={loadProfile} disabled={loading || !keycloakTokens?.access_token}>
            /profile
          </button>
          <button onClick={refresh} disabled={loading || !keycloakTokens?.refresh_token}>
            Refresh token
          </button>
        </div>
        {profile && <pre>{JSON.stringify(profile, null, 2)}</pre>}
      </section>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      {loading && <p>Loading...</p>}
    </main>
  );
}
