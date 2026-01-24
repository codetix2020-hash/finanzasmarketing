import { NextRequest, NextResponse } from 'next/server';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/tiktok/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  if (!TIKTOK_CLIENT_KEY) {
    return NextResponse.json({ error: 'TikTok Client Key not configured' }, { status: 500 });
  }

  // Crear state con organizationId (encriptado en base64)
  const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64');

  // URL de autorización de TikTok
  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', TIKTOK_CLIENT_KEY);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'user.info.basic,video.upload,video.publish');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}

