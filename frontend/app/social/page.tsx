"use client";

import { useMemo, useState } from "react";
import { FlowShell } from "../components/FlowShell";
import { useFlowState } from "../hooks/useFlowState";
import { facebookClientId, googleClientId } from "../lib/config";
import type { Provider } from "../lib/types";
import { providerLabel } from "../lib/types";

export default function SocialLoginPage() {
  const { socialToken, keycloakTokens, resetFlow } = useFlowState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectUriBase = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/oauth/callback`;
  }, []);

  const startSocialLogin = (provider: Provider) => {
    setError("");
    const clientId = provider === "google" ? googleClientId : facebookClientId;
    if (!clientId) {
      setError(`Config mancante per ${providerLabel[provider]} (NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID).`);
      return;
    }

    const redirectUri = `${redirectUriBase}?provider=${provider}`;
    const state = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
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
    setLoading(true);
    window.location.href = `${baseAuthUrl}?${params.toString()}`;
  };

  return (
    <FlowShell
      title="Login con provider social"
      lead="Fai partire il redirect verso Google o Facebook. Al ritorno in callback salva il token reale del provider."
      socialToken={socialToken}
      keycloakTokens={keycloakTokens}
    >
      <div className="social-buttons">
        <button className="button google" onClick={() => startSocialLogin("google")} disabled={loading}>
          <span className="provider-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#EA4335" d="M12 10.2v3.99h5.65c-.25 1.35-.97 2.5-2.05 3.28l3.31 2.57c1.94-1.79 3.06-4.42 3.06-7.68 0-.74-.07-1.45-.2-2.15z" />
              <path fill="#34A853" d="M6.62 14.28l-.87.66-2.63 2.05C4.66 19.93 8.08 22 12 22c2.7 0 4.96-.89 6.61-2.46l-3.31-2.57c-.91.61-2.07.98-3.3.98-2.54 0-4.7-1.71-5.46-4.07z" />
              <path fill="#4A90E2" d="M3.12 6.99C2.4 8.42 2 9.96 2 11.5c0 1.54.4 3.08 1.12 4.51l3.5-2.73c-.21-.61-.33-1.25-.33-1.78 0-.55.12-1.17.32-1.77z" />
              <path fill="#FBBC05" d="M12 4.96c1.48 0 2.81.52 3.86 1.55l2.89-2.9C16.94 1.93 14.7 1 12 1 8.08 1 4.66 3.06 3.12 6.99l3.5 2.73C7.3 6.67 9.46 4.96 12 4.96z" />
            </svg>
          </span>
          Accedi con Google
        </button>
        <button className="button facebook" onClick={() => startSocialLogin("facebook")} disabled={loading}>
          <span className="provider-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5 3.66 9.14 8.44 9.93v-7.03H7.9v-2.9h2.4V9.86c0-2.38 1.42-3.7 3.6-3.7 1.04 0 2.12.18 2.12.18v2.33h-1.19c-1.17 0-1.53.73-1.53 1.48v1.78h2.6l-.42 2.9h-2.18V22c4.78-.79 8.44-4.93 8.44-9.93z" />
            </svg>
          </span>
          Accedi con Facebook
        </button>
      </div>
      {loading && <p className="muted">Reindirizzamento in corso...</p>}
      {error && <p className="pill warning">{error}</p>}

      {socialToken?.token?.access_token && (
        <div className="panel">
          <div className="section-title">
            <h3>Token ottenuto da {providerLabel[socialToken.provider]}</h3>
            <span className="pill success">pronto</span>
          </div>
          <p className="muted small">Dopo il redirect il token viene salvato in sessionStorage per usarlo negli step successivi.</p>
          <div className="log-box">{socialToken.token.access_token}</div>
        </div>
      )}

      <div className="reset-row">
        <button className="button secondary" onClick={resetFlow} disabled={loading}>
          Reset flow
        </button>
      </div>
    </FlowShell>
  );
}
