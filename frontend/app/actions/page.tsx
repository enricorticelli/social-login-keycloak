"use client";

import { useEffect, useState } from "react";
import { FlowShell } from "../components/FlowShell";
import { useFlowState } from "../hooks/useFlowState";
import { apiBase } from "../lib/config";
import type { ProfilePayload } from "../lib/types";

export default function ActionsPage() {
  const { socialToken, keycloakTokens, setKeycloakTokens } = useFlowState();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionsOk, setActionsOk] = useState(false);

  useEffect(() => {
    if (!keycloakTokens?.accessToken) {
      setProfile(null);
      setActionsOk(false);
    }
  }, [keycloakTokens?.accessToken]);

  const loadProfile = async () => {
    if (!keycloakTokens?.accessToken) {
      setError("Nessun access token disponibile.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/profile`, {
        headers: { Authorization: `Bearer ${keycloakTokens.accessToken}` }
      });
      if (!response.ok) {
        throw new Error("Impossibile leggere il profilo");
      }
      const payload = (await response.json()) as ProfilePayload;
      setProfile(payload);
      setActionsOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!keycloakTokens?.refreshToken) {
      setError("Nessun refresh token disponibile.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: keycloakTokens.refreshToken })
      });
      const payload = (await response.json().catch(() => ({})));
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

  return (
    <FlowShell
      title="Prova le API protette"
      lead="Usa l'access token ottenuto dallo scambio per interrogare il backend o fare refresh."
      socialToken={socialToken}
      keycloakTokens={keycloakTokens}
      actionsOk={actionsOk}
    >
      <div className="panel">
        <div className="section-title">
          <div>
            <p className="step-eyebrow">Profile endpoint</p>
            <h3>GET /profile</h3>
          </div>
          <button className="button" onClick={loadProfile} disabled={loading || !keycloakTokens?.accessToken}>
            {loading ? "In corso..." : "Leggi profilo"}
          </button>
        </div>
        <p className="muted">Richiede un access token valido emesso da Keycloak.</p>
        {profile && <div className="log-box">{JSON.stringify(profile, null, 2)}</div>}
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <p className="step-eyebrow">Refresh</p>
            <h3>POST /auth/refresh</h3>
          </div>
          <button className="button secondary" onClick={refresh} disabled={loading || !keycloakTokens?.refreshToken}>
            {loading ? "In corso..." : "Refresh token"}
          </button>
        </div>
        <p className="muted">Aggiorna i token usando il refresh token restituito da Keycloak.</p>
        {keycloakTokens && <div className="log-box">{JSON.stringify(keycloakTokens, null, 2)}</div>}
      </div>

      {error && <p className="pill warning">{error}</p>}
    </FlowShell>
  );
}
