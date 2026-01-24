import { NextRequest, NextResponse } from 'next/server';

const clientId = process.env.INSTAGRAM_APP_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/instagram/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  if (!clientId) {
    return NextResponse.json({ error: 'Instagram App ID not configured' }, { status: 500 });
  }

  // Crear state con organizationId (encriptado en base64)
  const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64');

  // URL de autorización de Instagram
  const authUrl = new URL('https://api.instagram.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'user_profile,user_media');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}




