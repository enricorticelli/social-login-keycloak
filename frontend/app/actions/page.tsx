"use client";

import { useEffect, useState } from "react";
import { FlowShell } from "../components/FlowShell";
import { useFlowState } from "../hooks/useFlowState";
import { useI18n } from "../lib/i18n";
import { apiBase } from "../lib/config";
import type { ProfilePayload } from "../lib/types";

export default function ActionsPage() {
  const { t } = useI18n();
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
      setError(t("actions.error.noAccess"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/profile`, {
        headers: { Authorization: `Bearer ${keycloakTokens.accessToken}` }
      });
      if (!response.ok) {
        throw new Error(t("actions.error.profileFailed"));
      }
      const payload = (await response.json()) as ProfilePayload;
      setProfile(payload);
      setActionsOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error.unexpected"));
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!keycloakTokens?.refreshToken) {
      setError(t("actions.error.noRefresh"));
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
        throw new Error(t("actions.error.refreshFailed"));
      }
      setKeycloakTokens(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error.unexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlowShell
      title={t("actions.title")}
      lead={t("actions.lead")}
      socialToken={socialToken}
      keycloakTokens={keycloakTokens}
      actionsOk={actionsOk}
    >
      <div className="panel">
        <div className="section-title">
          <div>
            <p className="step-eyebrow">{t("actions.profile.eyebrow")}</p>
            <h3>{t("actions.profile.title")}</h3>
          </div>
          <button className="button" onClick={loadProfile} disabled={loading || !keycloakTokens?.accessToken}>
            {loading ? t("actions.profile.loading") : t("actions.profile.button")}
          </button>
        </div>
        <p className="muted">{t("actions.profile.info")}</p>
        {profile && <div className="log-box">{JSON.stringify(profile, null, 2)}</div>}
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <p className="step-eyebrow">{t("actions.refresh.eyebrow")}</p>
            <h3>{t("actions.refresh.title")}</h3>
          </div>
          <button className="button secondary" onClick={refresh} disabled={loading || !keycloakTokens?.refreshToken}>
            {loading ? t("actions.refresh.loading") : t("actions.refresh.button")}
          </button>
        </div>
        <p className="muted">{t("actions.refresh.info")}</p>
        {keycloakTokens && <div className="log-box">{JSON.stringify(keycloakTokens, null, 2)}</div>}
      </div>

      {error && <p className="pill warning">{error}</p>}
    </FlowShell>
  );
}
