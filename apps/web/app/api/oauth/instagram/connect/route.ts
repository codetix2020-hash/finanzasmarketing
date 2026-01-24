import { NextRequest, NextResponse } from 'next/server';

const clientId = process.env.FACEBOOK_APP_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/instagram/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  if (!clientId) {
    return NextResponse.json(
      { error: 'Instagram (Business) OAuth not configured (FACEBOOK_APP_ID)' },
      { status: 500 },
    );
  }

  // Crear state con organizationId (encriptado en base64)
  const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64');

  // Instagram Business API usa Facebook OAuth (Meta)
  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set(
    'scope',
    'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement',
  );
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}




