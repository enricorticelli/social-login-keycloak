"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useCallback } from "react";

export type Lang = "en" | "it";

type I18nContextValue = {
  lang: Lang;
  setLang: (value: Lang) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
};

const STORAGE_KEY = "lang";
const defaultLang: Lang = "en";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    "lang.label": "Language",
    "brand.title": "Keycloak Social Flow",
    "nav.social.label": "Social login",
    "nav.social.caption": "Get the real token",
    "nav.social.status": "✓",
    "nav.social.captionAuthed": "Signed in with {provider}",
    "nav.exchange.label": "Keycloak exchange",
    "nav.exchange.caption": "Exchange the token",
    "nav.exchange.status": "✓",
    "nav.exchange.captionAuthed": "Access token from Keycloak",
    "nav.actions.label": "Protected APIs",
    "nav.actions.caption": "Profile / refresh",
    "nav.actions.status": "✓",
    "shell.stepLive": "Live step",
    "social.title": "Login with social provider",
    "social.lead": "Launch the redirect to Google or Facebook. After the callback, the real provider token is saved.",
    "social.btn.google": "Sign in with Google",
    "social.btn.facebook": "Sign in with Facebook",
    "social.redirecting": "Redirecting...",
    "social.error.missingConfig": "Missing config for {provider} (NEXT_PUBLIC_{envVar}_CLIENT_ID).",
    "social.token.title": "Token obtained from {provider}",
    "social.token.saved": "After the redirect, the token is saved in sessionStorage for the next steps.",
    "social.status.ready": "ready",
    "social.reset": "Reset flow",
    "exchange.title": "Exchange the token with Keycloak",
    "exchange.lead": "Send the provider token to the backend and get access / refresh tokens signed by Keycloak.",
    "exchange.request.eyebrow": "Request",
    "exchange.request.title": "Token exchange",
    "exchange.button.exchange": "Exchange token",
    "exchange.button.loading": "Exchanging...",
    "exchange.info.sending": "You are sending the real {provider} token as subject token.",
    "exchange.warning.needSocial": "Complete social login first.",
    "exchange.response.eyebrow": "Keycloak response",
    "exchange.response.title": "Tokens received",
    "exchange.response.pill": "access + refresh",
    "exchange.error.noSocial": "Complete social login first.",
    "exchange.error.denied": "Keycloak rejected the token.",
    "actions.title": "Try the protected APIs",
    "actions.lead": "Use the access token obtained from the exchange to call the backend or refresh.",
    "actions.profile.eyebrow": "Profile endpoint",
    "actions.profile.title": "GET /profile",
    "actions.profile.button": "Read profile",
    "actions.profile.loading": "Working...",
    "actions.profile.info": "Requires a valid access token issued by Keycloak.",
    "actions.refresh.eyebrow": "Refresh",
    "actions.refresh.title": "POST /auth/refresh",
    "actions.refresh.button": "Refresh token",
    "actions.refresh.loading": "Working...",
    "actions.refresh.info": "Update tokens using the refresh token returned by Keycloak.",
    "actions.error.noAccess": "No access token available.",
    "actions.error.noRefresh": "No refresh token available.",
    "actions.error.profileFailed": "Unable to read profile.",
    "actions.error.refreshFailed": "Refresh failed.",
    "callback.title": "Social login callback",
    "callback.processing": "Processing login...",
    "callback.error.missing": "Missing parameters in callback.",
    "callback.error.state": "Invalid OAuth state. Retry login.",
    "callback.error.exchangeFailed": "Unable to obtain the token from provider.",
    "callback.exchange": "Exchanging code for provider token...",
    "callback.success": "Login successful, redirecting...",
    "common.error.unexpected": "Unexpected error"
  },
  it: {
    "lang.label": "Lingua",
    "brand.title": "Keycloak Social Flow",
    "nav.social.label": "Social login",
    "nav.social.caption": "Ottieni il token reale",
    "nav.social.status": "✓",
    "nav.social.captionAuthed": "Accesso con {provider}",
    "nav.exchange.label": "Token exchange",
    "nav.exchange.caption": "Scambia il token",
    "nav.exchange.status": "✓",
    "nav.exchange.captionAuthed": "Access token da Keycloak",
    "nav.actions.label": "API protette",
    "nav.actions.caption": "Profilo / refresh",
    "nav.actions.status": "✓",
    "shell.stepLive": "Step attivo",
    "social.title": "Login con provider social",
    "social.lead": "Fai partire il redirect verso Google o Facebook. Al ritorno in callback salva il token reale del provider.",
    "social.btn.google": "Accedi con Google",
    "social.btn.facebook": "Accedi con Facebook",
    "social.redirecting": "Reindirizzamento in corso...",
    "social.error.missingConfig": "Config mancante per {provider} (NEXT_PUBLIC_{envVar}_CLIENT_ID).",
    "social.token.title": "Token ottenuto da {provider}",
    "social.token.saved": "Dopo il redirect il token viene salvato in sessionStorage per usarlo negli step successivi.",
    "social.status.ready": "pronto",
    "social.reset": "Reset flow",
    "exchange.title": "Scambia il token con Keycloak",
    "exchange.lead": "Invia il token del provider alle API backend e ottieni access / refresh token firmati da Keycloak.",
    "exchange.request.eyebrow": "Richiesta",
    "exchange.request.title": "Token exchange",
    "exchange.button.exchange": "Scambia token",
    "exchange.button.loading": "Scambio in corso...",
    "exchange.info.sending": "Stai inviando il token reale di {provider} come subject token.",
    "exchange.warning.needSocial": "Serve prima un token social valido.",
    "exchange.response.eyebrow": "Risposta Keycloak",
    "exchange.response.title": "Token ottenuti",
    "exchange.response.pill": "access + refresh",
    "exchange.error.noSocial": "Completa prima il login con Google o Facebook.",
    "exchange.error.denied": "Keycloak ha rifiutato il token.",
    "actions.title": "Prova le API protette",
    "actions.lead": "Usa l'access token ottenuto dallo scambio per interrogare il backend o fare refresh.",
    "actions.profile.eyebrow": "Profile endpoint",
    "actions.profile.title": "GET /profile",
    "actions.profile.button": "Leggi profilo",
    "actions.profile.loading": "In corso...",
    "actions.profile.info": "Richiede un access token valido emesso da Keycloak.",
    "actions.refresh.eyebrow": "Refresh",
    "actions.refresh.title": "POST /auth/refresh",
    "actions.refresh.button": "Refresh token",
    "actions.refresh.loading": "In corso...",
    "actions.refresh.info": "Aggiorna i token usando il refresh token restituito da Keycloak.",
    "actions.error.noAccess": "Nessun access token disponibile.",
    "actions.error.noRefresh": "Nessun refresh token disponibile.",
    "actions.error.profileFailed": "Impossibile leggere il profilo.",
    "actions.error.refreshFailed": "Refresh fallito.",
    "callback.title": "Callback login social",
    "callback.processing": "Elaboro il login...",
    "callback.error.missing": "Parametri mancanti nella callback.",
    "callback.error.state": "State OAuth non valido. Riprova il login.",
    "callback.error.exchangeFailed": "Impossibile ottenere il token dal provider.",
    "callback.exchange": "Scambio il code con il token del provider...",
    "callback.success": "Login riuscito, reindirizzamento in corso...",
    "common.error.unexpected": "Errore imprevisto"
  }
};

const I18nContext = createContext<I18nContextValue | null>(null);

const interpolate = (template: string, values?: Record<string, string | number>) => {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => (values[key] !== undefined ? String(values[key]) : `{${key}}`));
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "it") {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((value: Lang) => {
    setLangState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }, []);

  const t = useMemo(() => {
    return (key: string, values?: Record<string, string | number>) => {
      const fallback = translations.en[key] ?? key;
      const template = translations[lang][key] ?? fallback;
      return interpolate(template, values);
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return ctx;
}
