"use client";

import { useState } from "react";
import { FlowShell } from "../components/FlowShell";
import { useFlowState } from "../hooks/useFlowState";
import { apiBase } from "../lib/config";
import { providerLabel } from "../lib/types";

export default function ExchangePage() {
  const { socialToken, keycloakTokens, setKeycloakTokens } = useFlowState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: socialToken.provider,
          subjectToken: socialToken.token.access_token,
          subjectIssuer: socialToken.provider
        })
      });
      const payload = (await response.json().catch(() => ({})));
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

  return (
    <FlowShell
      title="Scambia il token con Keycloak"
      lead="Invia il token del provider alle API backend e ottieni access / refresh token firmati da Keycloak."
      socialToken={socialToken}
      keycloakTokens={keycloakTokens}
    >
      <div className="panel">
        <div className="section-title">
          <div>
            <p className="step-eyebrow">Richiesta</p>
            <h3>Token exchange</h3>
          </div>
          <button className="button" onClick={exchangeWithKeycloak} disabled={loading || !socialToken?.token?.access_token}>
            {loading ? "Scambio in corso..." : "Scambia token"}
          </button>
        </div>
        {socialToken?.token?.access_token ? (
          <p className="muted">Stai inviando il token reale di {providerLabel[socialToken.provider]} come subject token.</p>
        ) : (
          <p className="pill warning">Serve prima un token social valido.</p>
        )}
        {error && <p className="pill warning" style={{ marginTop: "0.75rem" }}>{error}</p>}
      </div>

      {keycloakTokens && (
        <div className="panel">
          <div className="section-title">
            <div>
              <p className="step-eyebrow">Risposta Keycloak</p>
              <h3>Token ottenuti</h3>
            </div>
            <span className="pill success">access + refresh</span>
          </div>
          <div className="log-box">{JSON.stringify(keycloakTokens, null, 2)}</div>
        </div>
      )}
    </FlowShell>
  );
}
