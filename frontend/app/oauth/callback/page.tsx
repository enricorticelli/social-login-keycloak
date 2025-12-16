"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveKeycloakTokens, saveSocialToken } from "../../lib/storage";
import type { Provider } from "../../lib/types";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Elaboro il login...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const provider = searchParams.get("provider") as Provider | null;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!provider || !code || !state) {
      setError("Parametri mancanti nella callback.");
      return;
    }

    const savedState = sessionStorage.getItem(`oauth_state_${provider}`);
    if (!savedState || savedState !== state) {
      setError("State OAuth non valido. Riprova il login.");
      return;
    }

    const redirectUri = `${window.location.origin}/oauth/callback?provider=${provider}`;

    const exchangeToken = async () => {
      setMessage("Scambio il code con il token del provider...");
      const response = await fetch("/api/oauth/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ provider, code, redirectUri })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Impossibile ottenere il token dal provider");
      }

      sessionStorage.removeItem(`oauth_state_${provider}`);
      saveKeycloakTokens(null);
      saveSocialToken({ provider, token: payload });
      setMessage("Login riuscito, reindirizzamento in corso...");
      router.replace("/");
    };

    exchangeToken().catch(err => {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    });
  }, [router, searchParams]);

  return (
    <main>
      <h1>Callback login social</h1>
      {!error ? <p>{message}</p> : <p style={{ color: "#f87171" }}>{error}</p>}
    </main>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<main><p>Elaboro il login...</p></main>}>
      <CallbackContent />
    </Suspense>
  );
}
