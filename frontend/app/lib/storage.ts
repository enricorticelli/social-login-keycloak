import type { SocialToken, TokenPayload } from "./types";

const SOCIAL_KEY = "socialToken";
const KEYCLOAK_KEY = "keycloakTokens";

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const loadSocialToken = (): SocialToken | null => {
  if (typeof window === "undefined") return null;
  return safeParse<SocialToken>(sessionStorage.getItem(SOCIAL_KEY));
};

export const saveSocialToken = (payload: SocialToken | null) => {
  if (typeof window === "undefined") return;
  if (!payload) {
    sessionStorage.removeItem(SOCIAL_KEY);
    return;
  }
  sessionStorage.setItem(SOCIAL_KEY, JSON.stringify(payload));
};

export const loadKeycloakTokens = (): TokenPayload | null => {
  if (typeof window === "undefined") return null;
  return safeParse<TokenPayload>(sessionStorage.getItem(KEYCLOAK_KEY));
};

export const saveKeycloakTokens = (payload: TokenPayload | null) => {
  if (typeof window === "undefined") return;
  if (!payload) {
    sessionStorage.removeItem(KEYCLOAK_KEY);
    return;
  }
  sessionStorage.setItem(KEYCLOAK_KEY, JSON.stringify(payload));
};

export const clearFlow = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SOCIAL_KEY);
  sessionStorage.removeItem(KEYCLOAK_KEY);
};
