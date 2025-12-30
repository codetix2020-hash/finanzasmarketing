import { NextRequest, NextResponse } from "next/server";
import { attributionTracker } from "../../../../../packages/api/modules/marketing/services/attribution-tracker";

/**
 * Tracking Pixel Endpoint
 * GET /api/tracking/pixel.gif
 * 
 * Returns a 1x1 transparent GIF for invisible tracking
 * Tracks page views and events via query parameters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract tracking parameters
  const eventType = (searchParams.get("event") as any) || "page_view";
  const userId = searchParams.get("userId") || undefined;
  const visitorId =
    searchParams.get("visitorId") ||
    searchParams.get("vid") ||
    `visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const sessionId =
    searchParams.get("sessionId") ||
    searchParams.get("sid") ||
    `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Attribution data from UTM params
  const utmSource = searchParams.get("utm_source") || searchParams.get("source");
  const utmMedium = searchParams.get("utm_medium") || searchParams.get("medium");
  const utmCampaign = searchParams.get("utm_campaign") || searchParams.get("campaign");
  const utmContent = searchParams.get("utm_content");
  const utmTerm = searchParams.get("utm_term");

  // Additional context
  const landingPage = searchParams.get("landing_page") || searchParams.get("page");
  const referrer = searchParams.get("referrer") || searchParams.get("ref");
  const device = searchParams.get("device");

  // Organization (optional)
  const organizationId = searchParams.get("org");

  try {
    // Track the event
    await attributionTracker.trackEvent({
      userId,
      visitorId,
      sessionId,
      organizationId: organizationId || undefined,
      eventType,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      utmContent: utmContent || undefined,
      utmTerm: utmTerm || undefined,
      landingPage: landingPage || undefined,
      referrer: referrer || undefined,
      device: device || undefined,
    });

    console.log(`📊 Pixel tracked: ${eventType} - ${visitorId}`);
  } catch (error) {
    console.error("❌ Error tracking pixel:", error);
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Support OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

