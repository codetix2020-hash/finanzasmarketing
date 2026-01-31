import { NextRequest, NextResponse } from 'next/server';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/facebook/callback';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  if (!FACEBOOK_APP_ID) {
    return NextResponse.json(
      { error: 'Facebook OAuth not configured (FACEBOOK_APP_ID)' },
      { status: 500 }
    );
  }

  // Crear state con organizationId (encriptado en base64)
  const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64');

  // Scopes necesarios para publicar en Pages
  const scope = [
    'pages_show_list',
    'pages_read_engagement', 
    'pages_manage_posts',
    'public_profile',
  ].join(',');

  // URL de autorización de Facebook
  const authUrl = new URL('https://www.facebook.com/v24.0/dialog/oauth');
  authUrl.searchParams.set('client_id', FACEBOOK_APP_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}




