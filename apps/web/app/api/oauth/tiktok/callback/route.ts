import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { auth } from "@repo/auth";

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
    } catch (e) {
      console.error("Failed to decode state:", e);
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    console.log("TikTok token response:", tokenData);
    
    // TikTok API v2 returns data in tokenData.data or tokenData directly
    const tokenInfo = tokenData.data || tokenData;
    
    if (tokenData.error || (!tokenInfo.access_token)) {
      console.error("TikTok token error:", tokenData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app?error=tiktok_token_failed`);
    }
    
    const { access_token, refresh_token, open_id, expires_in } = tokenInfo;
    
    // Get user info
    const userResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username",
      {
        headers: { "Authorization": `Bearer ${access_token}` },
      }
    );
    
    const userData = await userResponse.json();
    const userInfo = userData.data?.user || {};
    
    // If no organizationId in state, get from session
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
    
    // Save TikTok account - use the correct unique index
    // Schema: @@unique([organizationId, platform, accountId])
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        organizationId: organizationId,
        platform: "tiktok",
      },
    });
    
    if (existingAccount) {
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || null,
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
          organizationId: organizationId,
          accessToken: access_token,
          refreshToken: refresh_token || null,
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
    console.error("TikTok OAuth error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app?error=tiktok_failed`);
  }
}
