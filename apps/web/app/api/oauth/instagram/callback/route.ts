import { NextRequest, NextResponse } from 'next/server';
import { socialAccountsService } from '@repo/api/modules/marketing/services/social-accounts-service';
import { getOrganizationById } from '@repo/database';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/instagram/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contiene organizationId
  const error = searchParams.get('error');

  // Helper para construir URL de redirección correcta
  const buildRedirectUrl = async (organizationId: string, params: string) => {
    const org = await getOrganizationById(organizationId);
    const baseUrl = new URL(request.url).origin;
    if (org?.slug) {
      return `${baseUrl}/app/${org.slug}/settings/integrations?${params}`;
    }
    // Fallback si no hay slug
    return `${baseUrl}/app/settings/integrations?${params}`;
  };

  if (error) {
    console.error('Instagram OAuth error:', error);
    const state = searchParams.get('state');
    if (state) {
      try {
        const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());
        const redirectUrl = await buildRedirectUrl(organizationId, 'error=instagram_auth_failed');
        return NextResponse.redirect(redirectUrl);
      } catch {
        // Fallback si no se puede decodificar state
      }
    }
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=instagram_auth_failed`);
  }

  if (!code || !state) {
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=missing_params`);
  }

  try {
    // Decodificar state para obtener organizationId
    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // PASO 1: Intercambiar code por short-lived access token
    const tokenResponse = await fetch(
      `https://api.instagram.com/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }

    // PASO 2: Convertir a long-lived token (60 días)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${INSTAGRAM_APP_SECRET}&` +
      `access_token=${tokenData.access_token}`
    );

    const longLivedData = await longLivedResponse.json();
    const accessToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // Segundos

    // PASO 3: Obtener información de la cuenta
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`
    );
    
    const userData = await userResponse.json();

    // PASO 4: Guardar en base de datos
    await socialAccountsService.connectAccount({
      organizationId,
      platform: 'instagram',
      accountId: userData.id,
      accountName: userData.username,
      accessToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      businessId: userData.id,
    });

    console.log(`Instagram connected: @${userData.username} for org ${organizationId}`);

    // Obtener slug de la organización para redirección correcta
    const org = await getOrganizationById(organizationId);
    const baseUrl = new URL(request.url).origin;
    const redirectUrl = org?.slug 
      ? `${baseUrl}/app/${org.slug}/settings/integrations?success=instagram_connected`
      : `${baseUrl}/app/settings/integrations?success=instagram_connected`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    
    // Intentar obtener organizationId del state para redirección correcta
    try {
      const state = searchParams.get('state');
      if (state) {
        const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());
        const org = await getOrganizationById(organizationId);
        const baseUrl = new URL(request.url).origin;
        const redirectUrl = org?.slug
          ? `${baseUrl}/app/${org.slug}/settings/integrations?error=connection_failed`
          : `${baseUrl}/app/settings/integrations?error=connection_failed`;
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      // Fallback
    }
    
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=connection_failed`);
  }
}




