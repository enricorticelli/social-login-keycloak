"use client";

import { useCallback, useEffect, useState } from "react";
import { clearFlow, loadKeycloakTokens, loadSocialToken, saveKeycloakTokens, saveSocialToken } from "../lib/storage";
import type { SocialToken, TokenPayload } from "../lib/types";

export function useFlowState() {
  const [socialToken, setSocialToken] = useState<SocialToken | null>(null);
  const [keycloakTokens, setKeycloakTokens] = useState<TokenPayload | null>(null);

  useEffect(() => {
    setSocialToken(loadSocialToken());
    setKeycloakTokens(loadKeycloakTokens());
  }, []);

  const persistSocialToken = useCallback((value: SocialToken | null) => {
    setSocialToken(value);
    saveSocialToken(value);
    if (value === null) {
      setKeycloakTokens(null);
      saveKeycloakTokens(null);
    }
  }, []);

  const persistKeycloakTokens = useCallback((value: TokenPayload | null) => {
    setKeycloakTokens(value);
    saveKeycloakTokens(value);
  }, []);

  const resetFlow = useCallback(() => {
    persistSocialToken(null);
    persistKeycloakTokens(null);
    clearFlow();
  }, [persistKeycloakTokens, persistSocialToken]);

  return { socialToken, keycloakTokens, setSocialToken: persistSocialToken, setKeycloakTokens: persistKeycloakTokens, resetFlow };
}
