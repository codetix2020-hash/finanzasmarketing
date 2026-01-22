import { NextRequest, NextResponse } from 'next/server';
import { socialAccountsService } from '@repo/api/modules/marketing/services/social-accounts-service';

const INSTAGRAM_APP_ID = process.env.FACEBOOK_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/instagram/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contiene organizationId
  const error = searchParams.get('error');

  if (error) {
    console.error('Instagram OAuth error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?error=instagram_auth_failed', request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?error=missing_params', request.url)
    );
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

    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?success=instagram_connected', request.url)
    );
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?error=connection_failed', request.url)
    );
  }
}



