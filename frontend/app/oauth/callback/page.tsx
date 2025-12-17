"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "../../lib/i18n";
import { apiBase } from "../../lib/config";
import { saveKeycloakTokens, saveSocialToken } from "../../lib/storage";
import type { Provider } from "../../lib/types";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [message, setMessage] = useState(t("callback.processing"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const provider = searchParams.get("provider") as Provider | null;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!provider || !code || !state) {
      setError(t("callback.error.missing"));
      return;
    }

    const savedState = sessionStorage.getItem(`oauth_state_${provider}`);
    if (!savedState || savedState !== state) {
      setError(t("callback.error.state"));
      return;
    }

    const redirectUri = `${window.location.origin}/oauth/callback?provider=${provider}`;

    const exchangeToken = async () => {
      setMessage(t("callback.exchange"));
      const response = await fetch(`${apiBase}/auth/social/${provider}/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, redirectUri })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { detail?: string }).detail ?? t("callback.error.exchangeFailed"));
      }

      sessionStorage.removeItem(`oauth_state_${provider}`);
      saveKeycloakTokens(null);
      // Mappiamo la risposta camelCase dal backend
      const tokenPayload = payload as {
        accessToken: string;
        tokenType?: string;
        expiresIn?: number;
        refreshToken?: string;
        idToken?: string;
        scope?: string;
      };
      saveSocialToken({
        provider,
        token: {
          access_token: tokenPayload.accessToken,
          token_type: tokenPayload.tokenType,
          expires_in: tokenPayload.expiresIn,
          refresh_token: tokenPayload.refreshToken,
          id_token: tokenPayload.idToken,
          scope: tokenPayload.scope
        }
      });
      setMessage(t("callback.success"));
      router.replace("/");
    };

    exchangeToken().catch(err => {
      setError(err instanceof Error ? err.message : t("common.error.unexpected"));
    });
  }, [router, searchParams, t]);

  return (
    <main>
      <h1>{t("callback.title")}</h1>
      {!error ? <p>{message}</p> : <p style={{ color: "#f87171" }}>{error}</p>}
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<main><p>Processing login...</p></main>}>
      <CallbackContent />
    </Suspense>
  );
}
