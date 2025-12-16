export type Provider = "google" | "facebook";

export type ProviderToken = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  id_token?: string;
  scope?: string;
};

export type SocialToken = {
  provider: Provider;
  token: ProviderToken;
};

export type TokenPayload = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  tokenType?: string;
  idToken?: string;
  scope?: string;
};

export type ProfilePayload = {
  sub: string;
  email: string;
  preferred_username: string;
  name: string;
};

export const providerLabel: Record<Provider, string> = {
  google: "Google",
  facebook: "Facebook"
};
