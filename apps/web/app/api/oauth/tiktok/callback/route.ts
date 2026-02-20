import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { auth } from "@repo/auth";
import { encryptToken } from "@repo/api/lib/token-encryption";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");
  
  if (error) {
    console.error("TikTok OAuth error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app?error=tiktok_denied`);
  }
  
  if (!code || !stateParam) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app?error=tiktok_invalid`);
  }
  
  try {
    let organizationId: string | null = null;
    try {
      const stateData = JSON.parse(Buffer.from(stateParam, "base64").toString());
      organizationId = stateData.organizationId;
    } catch {
      // Invalid state
    }
    
    const bodyParams = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`,
    });

    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams,
    });

    const responseText = await tokenResponse.text();
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app?error=tiktok_invalid_response`);
    }

    const tokenInfo = tokenData.data || tokenData;
    
    if (tokenData.error || !tokenInfo.access_token) {
      console.error("TikTok token exchange failed");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app?error=tiktok_token_failed`);
    }
    
    const { access_token, refresh_token, open_id, expires_in } = tokenInfo;
    
    const userResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username",
      { headers: { "Authorization": `Bearer ${access_token}` } }
    );
    
    const userData = await userResponse.json();
    const userInfo = userData.data?.user || {};
    
    if (!organizationId) {
      const session = await auth.api.getSession({ headers: request.headers });
      if (session?.session?.userId) {
        const membership = await prisma.member.findFirst({
          where: { userId: session.session.userId },
          select: { organizationId: true },
        });
        organizationId = membership?.organizationId || null;
      }
    }
    
    if (!organizationId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app?error=no_organization`);
    }
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { slug: true },
    });

    const encryptedAccessToken = encryptToken(access_token);
    const encryptedRefreshToken = refresh_token ? encryptToken(refresh_token) : null;
    
    const existingAccount = await prisma.socialAccount.findFirst({
      where: { organizationId, platform: "tiktok" },
    });
    
    if (existingAccount) {
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          accountId: open_id,
          accountName: userInfo.display_name || "TikTok User",
          avatarUrl: userInfo.avatar_url || null,
          tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
          isActive: true,
          lastSyncAt: new Date(),
        },
      });
    } else {
      await prisma.socialAccount.create({
        data: {
          platform: "tiktok",
          organizationId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          accountId: open_id,
          accountName: userInfo.display_name || "TikTok User",
          avatarUrl: userInfo.avatar_url || null,
          tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
          isActive: true,
        },
      });
    }
    
    const redirectUrl = organization?.slug
      ? `${process.env.NEXT_PUBLIC_APP_URL}/app/${organization.slug}/settings/integrations?success=tiktok`
      : `${process.env.NEXT_PUBLIC_APP_URL}/app?success=tiktok`;
    
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error("TikTok OAuth callback error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app?error=tiktok_failed`);
  }
}
