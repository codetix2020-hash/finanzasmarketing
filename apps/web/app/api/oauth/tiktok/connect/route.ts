import { NextRequest, NextResponse } from "next/server";
import { auth } from "@repo/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.session?.userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    
    if (!clientKey) {
      console.error("TIKTOK_CLIENT_KEY not configured");
      return NextResponse.json(
        { error: "TikTok Client Key not configured" },
        { status: 500 }
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`;
    const organizationId = request.nextUrl.searchParams.get("organizationId");
    const scope = "user.info.basic,user.info.profile,video.upload,video.publish";
    
    const state = Buffer.from(JSON.stringify({
      organizationId,
      nonce: crypto.randomUUID()
    })).toString("base64");
    
    const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
    authUrl.searchParams.set("client_key", clientKey);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);
    
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("TikTok connect error:", error);
    return NextResponse.json({ error: "Failed to initiate TikTok OAuth" }, { status: 500 });
  }
}
