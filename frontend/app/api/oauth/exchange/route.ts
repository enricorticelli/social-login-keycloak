import { NextRequest, NextResponse } from "next/server";

type Provider = "google" | "facebook";

const providers: Record<Provider, { tokenUrl: string; clientId?: string; clientSecret?: string }> = {
  google: {
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  },
  facebook: {
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET
  }
};

export async function POST(request: NextRequest) {
  const { provider, code, redirectUri } = await request.json();
  const typedProvider = provider as Provider | undefined;

  if (!typedProvider || !code || !redirectUri) {
    return NextResponse.json({ error: "Parametri mancanti (provider, code, redirectUri)" }, { status: 400 });
  }

  const config = providers[typedProvider];
  if (!config) {
    return NextResponse.json({ error: `Provider non supportato: ${provider}` }, { status: 400 });
  }

  if (!config.clientId || !config.clientSecret) {
    return NextResponse.json(
      { error: `Config mancante per ${typedProvider}. Imposta ${typedProvider.toUpperCase()}_CLIENT_ID e ${typedProvider.toUpperCase()}_CLIENT_SECRET.` },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    code,
    grant_type: "authorization_code"
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = (payload as { error?: string; error_description?: string }).error_description ?? (payload as { error?: string }).error ?? "Impossibile ottenere l'access token dal provider";
    return NextResponse.json({ error: detail }, { status: 502 });
  }

  return NextResponse.json(payload);
}
