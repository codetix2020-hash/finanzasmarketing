import { NextRequest, NextResponse } from "next/server";
import { attributionTracker } from "../../../../../packages/api/modules/marketing/services/attribution-tracker";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Event Tracking Endpoint
 * POST /api/tracking/event
 * 
 * Track custom events from JavaScript (clicks, form submissions, etc)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      event,
      eventType,
      userId,
      visitorId,
      sessionId,
      organizationId,
      value,
      campaign,
      source,
      medium,
      metadata,
    } = body;

    // Validate required fields
    if (!event && !eventType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: event or eventType",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate IDs if not provided
    const finalVisitorId =
      visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const finalSessionId =
      sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Track the event
    const eventId = await attributionTracker.trackEvent({
      userId,
      visitorId: finalVisitorId,
      sessionId: finalSessionId,
      organizationId,
      eventType: event || eventType,
      eventValue: value ? parseFloat(value) : undefined,
      campaign,
      source,
      medium,
      metadata,
    });

    console.log(`✅ Event tracked: ${event || eventType} - ${eventId}`);

    return NextResponse.json(
      {
        success: true,
        eventId,
        visitorId: finalVisitorId,
        sessionId: finalSessionId,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("❌ Error tracking event:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

