"use client";

import { useState } from "react";
import { FlowShell } from "../components/FlowShell";
import { useFlowState } from "../hooks/useFlowState";
import { useI18n } from "../lib/i18n";
import { apiBase } from "../lib/config";
import { providerLabel } from "../lib/types";

export default function ExchangePage() {
  const { t } = useI18n();
  const { socialToken, keycloakTokens, setKeycloakTokens } = useFlowState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exchangeWithKeycloak = async () => {
    if (!socialToken?.token?.access_token) {
      setError(t("exchange.error.noSocial"));
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
        throw new Error((payload as { detail?: string }).detail ?? t("exchange.error.denied"));
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
      title={t("exchange.title")}
      lead={t("exchange.lead")}
      socialToken={socialToken}
      keycloakTokens={keycloakTokens}
    >
      <div className="panel">
        <div className="section-title">
          <div>
            <p className="step-eyebrow">{t("exchange.request.eyebrow")}</p>
            <h3>{t("exchange.request.title")}</h3>
          </div>
          <button className="button" onClick={exchangeWithKeycloak} disabled={loading || !socialToken?.token?.access_token}>
            {loading ? t("exchange.button.loading") : t("exchange.button.exchange")}
          </button>
        </div>
        {socialToken?.token?.access_token ? (
          <p className="muted">{t("exchange.info.sending", { provider: providerLabel[socialToken.provider] })}</p>
        ) : (
          <p className="pill warning">{t("exchange.warning.needSocial")}</p>
        )}
        {error && <p className="pill warning" style={{ marginTop: "0.75rem" }}>{error}</p>}
      </div>

      {keycloakTokens && (
        <div className="panel">
          <div className="section-title">
            <div>
              <p className="step-eyebrow">{t("exchange.response.eyebrow")}</p>
              <h3>{t("exchange.response.title")}</h3>
            </div>
            <span className="pill success">{t("exchange.response.pill")}</span>
          </div>
          <div className="log-box">{JSON.stringify(keycloakTokens, null, 2)}</div>
        </div>
      )}
    </FlowShell>
  );
}
