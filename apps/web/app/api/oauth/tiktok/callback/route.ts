import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function getBaseUrl(requestUrl: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(requestUrl).origin;
  return baseUrl.replace(/\/$/, '');
}

async function buildRedirectUrl(requestUrl: string, organizationId: string, qs: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  const baseUrl = getBaseUrl(requestUrl);
  if (org?.slug) {
    return `${baseUrl}/app/${org.slug}/settings/integrations?${qs}`;
  }
  return `${baseUrl}/app/settings/integrations?${qs}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  
  console.log("TikTok callback received:", { code: !!code, state: !!stateParam, error });

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
    console.error("TikTok OAuth error:", error, errorDescription);
    if (stateParam) {
      try {
        const stateData = JSON.parse(Buffer.from(stateParam, "base64").toString());
        const organizationId = stateData.organizationId;
        if (organizationId) {
          const redirectUrl = await buildRedirectUrl(
            request.url,
            organizationId,
            "error=tiktok_auth_failed"
          );
          return NextResponse.redirect(redirectUrl);
        }
      } catch {
        // Fallback
      }
    }
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=tiktok_auth_failed`);
  }
  
  if (!code || !stateParam) {
    console.error("Missing code or state");
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=tiktok_invalid`);
  }

  try {
    // Decode state to get organizationId
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
        "Cache-Control": "no-cache",
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
    console.log("TikTok token response:", JSON.stringify(tokenData, null, 2));
    
    if (tokenData.error || !tokenData.data?.access_token) {
      console.error("TikTok token error:", tokenData);
      const baseUrl = getBaseUrl(request.url);
      return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=tiktok_token_failed`);
    }
    
    const { access_token, refresh_token, open_id, expires_in, refresh_expires_in } = tokenData.data;
    
    // Get user info
    const userResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url,username",
      {
        headers: {
          "Authorization": `Bearer ${access_token}`,
        },
      }
    );
    
    const userData = await userResponse.json();
    console.log("TikTok user data:", JSON.stringify(userData, null, 2));
    
    const userInfo = userData.data?.user || {};
    const displayName = userInfo.display_name || userInfo.username || "TikTok User";
    const username = userInfo.username || open_id;
    
    // If no organizationId in state, get from session
    if (!organizationId) {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.session?.userId) {
        const membership = await prisma.member.findFirst({
          where: { userId: session.session.userId },
          select: { organizationId: true },
        });
        organizationId = membership?.organizationId || null;
      }
    }
    
    if (!organizationId) {
      console.error("No organizationId found");
      const baseUrl = getBaseUrl(request.url);
      return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=no_organization`);
    }
    
    // Save or update TikTok account
    await prisma.socialAccount.upsert({
      where: {
        organizationId_platform_accountId: {
          organizationId: organizationId,
          platform: "tiktok",
          accountId: open_id,
        },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || null,
        accountId: open_id,
        accountName: displayName,
        avatarUrl: userInfo.avatar_url || null,
        tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        platform: "tiktok",
        organizationId: organizationId,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        accountId: open_id,
        accountName: displayName,
        avatarUrl: userInfo.avatar_url || null,
        tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
        isActive: true,
      },
    });
    
    console.log("TikTok account saved successfully for org:", organizationId);
    
    const redirectUrl = await buildRedirectUrl(
      request.url,
      organizationId,
      "success=tiktok_connected"
    );
    
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error("TikTok OAuth error:", error);
    const baseUrl = getBaseUrl(request.url);
    return NextResponse.redirect(`${baseUrl}/app/settings/integrations?error=tiktok_failed`);
  }
}

