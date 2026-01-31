import { NextRequest, NextResponse } from "next/server";
import { socialAccountsService } from "@repo/api/modules/marketing/services/social-accounts-service";
import { getOrganizationById } from "@repo/database";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/facebook/callback';

const GRAPH_BASE = "https://graph.facebook.com/v24.0";

function getBaseUrl(requestUrl: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(requestUrl).origin;
  return baseUrl.replace(/\/$/, '');
}

async function buildRedirectUrl(requestUrl: string, organizationId: string, qs: string) {
  const org = await getOrganizationById(organizationId);
  const baseUrl = getBaseUrl(requestUrl);

  if (org?.slug) {
    return `${baseUrl}/app/${org.slug}/settings/integrations?${qs}`;
  }

  return `${baseUrl}/app/settings/integrations?${qs}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // base64(JSON({ organizationId }))
  const error = searchParams.get('error');

  console.log('Facebook OAuth callback:', { code: !!code, error, state: !!state });

  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return NextResponse.json(
      { error: "Facebook OAuth env vars not configured (FACEBOOK_APP_ID/FACEBOOK_APP_SECRET)" },
      { status: 500 },
    );
  }

  // Manejo de error devuelto por Meta
  if (error) {
    console.error("Facebook OAuth error:", {
      error,
      errorReason: searchParams.get("error_reason"),
      errorDescription: searchParams.get("error_description"),
    });

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString());
        const organizationId = decoded?.organizationId as string | undefined;
        if (organizationId) {
          const redirectUrl = await buildRedirectUrl(
            request.url,
            organizationId,
            "error=facebook_auth_failed",
          );
          return NextResponse.redirect(redirectUrl);
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.redirect(
      `${getBaseUrl(request.url)}/app/settings/integrations?error=facebook_auth_failed`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${getBaseUrl(request.url)}/app/settings/integrations?error=missing_params`,
    );
  }

  let organizationId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    organizationId = decoded.organizationId;
    if (!organizationId) {
      throw new Error("Missing organizationId in state");
    }
  } catch (e) {
    console.error("Invalid state in Facebook callback:", e);
    return NextResponse.redirect(
      `${getBaseUrl(request.url)}/app/settings/integrations?error=invalid_state`,
    );
  }

  try {
    // PASO 1: Intercambiar code por User Access Token
    console.log('Exchanging code for token...');
    const tokenUrl = new URL(`${GRAPH_BASE}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    tokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), { cache: "no-store" });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData?.access_token) {
      throw new Error(
        `Token exchange failed: ${JSON.stringify(tokenData)}`,
      );
    }

    const userAccessToken = tokenData.access_token as string;
    const expiresIn =
      typeof tokenData.expires_in === "number" ? tokenData.expires_in : undefined;
    console.log('Got user access token');

    // PASO 2: Obtener páginas del usuario con sus Page Access Tokens
    console.log('Fetching user pages...');
    const pagesUrl = new URL(`${GRAPH_BASE}/me/accounts`);
    pagesUrl.searchParams.set("fields", "id,name,access_token");
    pagesUrl.searchParams.set("access_token", userAccessToken);

    const pagesRes = await fetch(pagesUrl.toString(), { cache: "no-store" });
    const pagesData = await pagesRes.json();
    console.log('Pages response:', JSON.stringify(pagesData, null, 2));

    if (!pagesRes.ok || !Array.isArray(pagesData?.data)) {
      throw new Error(`Failed to fetch pages: ${JSON.stringify(pagesData)}`);
    }

    if (pagesData.data.length === 0) {
      console.error('No Facebook Pages found');
      const redirectUrl = await buildRedirectUrl(
        request.url,
        organizationId,
        "error=no_facebook_pages",
      );
      return NextResponse.redirect(redirectUrl);
    }

    // PASO 3: Usar la primera página (podrías mostrar selector si hay múltiples)
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token; // ESTE es el que necesitamos para publicar
    const pageId = page.id;
    const pageName = page.name;

    console.log('Selected page:', { pageId, pageName });

    // PASO 4: Guardar en base de datos
    await socialAccountsService.connectAccount({
      organizationId,
      platform: 'facebook',
      accountId: pageId,
      accountName: pageName,
      accessToken: pageAccessToken, // Guardamos el PAGE access token, no el user token
      tokenExpiresAt: expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : undefined,
      pageId: pageId,
    });

    console.log('Facebook Page connected successfully:', pageName);

    const redirectUrl = await buildRedirectUrl(
      request.url,
      organizationId,
      "success=facebook_connected",
    );
    return NextResponse.redirect(redirectUrl);

  } catch (e) {
    console.error("Facebook OAuth callback error:", e);
    const redirectUrl = await buildRedirectUrl(
      request.url,
      organizationId,
      "error=connection_failed",
    );
    return NextResponse.redirect(redirectUrl);
  }
}

