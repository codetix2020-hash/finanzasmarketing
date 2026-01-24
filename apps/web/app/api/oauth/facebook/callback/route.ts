import { NextRequest, NextResponse } from 'next/server';
import { socialAccountsService } from '@repo/api/modules/marketing/services/social-accounts-service';
import { getOrganizationById } from '@repo/database';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/facebook/callback';

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
    console.error('Facebook OAuth error:', error);
    const state = searchParams.get('state');
    if (state) {
      try {
        const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());
        const redirectUrl = await buildRedirectUrl(organizationId, 'error=facebook_auth_failed');
        return NextResponse.redirect(redirectUrl);
      } catch {
        // Fallback
      }
    }
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=facebook_auth_failed`);
  }

  if (!code || !state) {
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=missing_params`);
  }

  try {
    // Decodificar state para obtener organizationId
    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // PASO 1: Intercambiar code por access token
    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
    tokenUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString(), { cache: 'no-store' });
    const tokenData = await tokenRes.json();
    
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error('No access token received: ' + JSON.stringify(tokenData));
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000; // 60 días por defecto

    // PASO 2: Obtener información del usuario y páginas
    const meResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`
    );
    
    const meData = await meResponse.json();

    // PASO 3: Obtener páginas del usuario
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
    );
    
    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    // Usar la primera página o el perfil del usuario
    const accountToUse = pages.length > 0 ? pages[0] : meData;
    const pageId = pages.length > 0 ? accountToUse.id : null;

    // PASO 4: Guardar en base de datos
    await socialAccountsService.connectAccount({
      organizationId,
      platform: 'facebook',
      accountId: accountToUse.id,
      accountName: accountToUse.name || meData.name,
      accessToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      pageId: pageId || undefined,
    });

    console.log(`Facebook connected: ${accountToUse.name} for org ${organizationId}`);

    // Obtener slug de la organización para redirección correcta
    const org = await getOrganizationById(organizationId);
    const baseUrl = getBaseUrl(request.url);
    const redirectUrl = org?.slug 
      ? `${baseUrl}/app/${org.slug}/settings/integrations?success=facebook_connected`
      : `${baseUrl}/app/settings/integrations?success=facebook_connected`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    
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

