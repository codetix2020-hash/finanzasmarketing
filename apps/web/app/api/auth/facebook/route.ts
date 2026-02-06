import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
  
  if (!appId) {
    return NextResponse.json({ error: "Facebook App ID not configured" }, { status: 500 });
  }
  
  // Permisos necesarios para publicar en Pages
  const scope = [
    'pages_show_list',
    'pages_read_engagement', 
    'pages_manage_posts',
    'pages_manage_metadata',
  ].join(',');

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(authUrl);
}



