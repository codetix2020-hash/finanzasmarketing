import { NextRequest, NextResponse } from 'next/server';
import { socialAccountsService } from '@repo/api/modules/marketing/services/social-accounts-service';
import { getOrganizationById } from '@repo/database';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/tiktok/callback';

function getBaseUrl(requestUrl: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(requestUrl).origin;
  return baseUrl.replace(/\/$/, '');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contiene organizationId
  const error = searchParams.get('error');

  // Helper para construir URL de redirección correcta
  const buildRedirectUrl = async (organizationId: string, params: string) => {
    const org = await getOrganizationById(organizationId);
    const baseUrl = getBaseUrl(request.url);
    if (org?.slug) {
      return `${baseUrl}/app/${org.slug}/settings/integrations?${params}`;
    }
    return `${baseUrl}/app/settings/integrations?${params}`;
  };

  if (error) {
    console.error('TikTok OAuth error:', error);
    const state = searchParams.get('state');
    if (state) {
      try {
        const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());
        const redirectUrl = await buildRedirectUrl(organizationId, 'error=tiktok_auth_failed');
        return NextResponse.redirect(redirectUrl);
      } catch {
        // Fallback
      }
    }
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=tiktok_auth_failed`);
  }

  if (!code || !state) {
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=missing_params`);
  }

  try {
    // Decodificar state para obtener organizationId
    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // PASO 1: Intercambiar code por access token
    const tokenResponse = await fetch(
      `https://open.tiktokapis.com/v2/oauth/token/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: TIKTOK_CLIENT_KEY,
          client_secret: TIKTOK_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.data?.access_token) {
      throw new Error('No access token received: ' + JSON.stringify(tokenData));
    }

    const accessToken = tokenData.data.access_token;
    const refreshToken = tokenData.data.refresh_token;
    const expiresIn = tokenData.data.expires_in || 7200; // 2 horas por defecto

    // PASO 2: Obtener información del usuario
    const userResponse = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    const userData = await userResponse.json();
    const userInfo = userData.data?.user || {};

    // PASO 3: Guardar en base de datos
    await socialAccountsService.connectAccount({
      organizationId,
      platform: 'tiktok',
      accountId: userInfo.open_id || userInfo.union_id || 'unknown',
      accountName: userInfo.display_name || 'TikTok User',
      accessToken,
      refreshToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      avatarUrl: userInfo.avatar_url || undefined,
    });

    console.log(`TikTok connected: ${userInfo.display_name} for org ${organizationId}`);

    // Obtener slug de la organización para redirección correcta
    const org = await getOrganizationById(organizationId);
    const baseUrl = getBaseUrl(request.url);
    const redirectUrl = org?.slug 
      ? `${baseUrl}/app/${org.slug}/settings/integrations?success=tiktok_connected`
      : `${baseUrl}/app/settings/integrations?success=tiktok_connected`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    
    // Intentar obtener organizationId del state para redirección correcta
    try {
      const state = searchParams.get('state');
      if (state) {
        const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());
        const org = await getOrganizationById(organizationId);
        const baseUrl = getBaseUrl(request.url);
        const redirectUrl = org?.slug
          ? `${baseUrl}/app/${org.slug}/settings/integrations?error=connection_failed`
          : `${baseUrl}/app/settings/integrations?error=connection_failed`;
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      // Fallback
    }
    
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=connection_failed`);
  }
}

