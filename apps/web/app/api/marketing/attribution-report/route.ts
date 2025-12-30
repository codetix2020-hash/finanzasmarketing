import { NextRequest, NextResponse } from "next/server";
import { attributionTracker } from "../../../../../packages/api/modules/marketing/services/attribution-tracker";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Get Attribution Report
 * GET /api/marketing/attribution-report?org=ORG_ID&start=DATE&end=DATE
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("org");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: org",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse time range if provided
    const timeRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;

    // Get attribution report
    const report = await attributionTracker.getAttributionReport(organizationId, timeRange);

    console.log(`✅ Attribution report generated for org ${organizationId}`);

    return NextResponse.json(
      {
        success: true,
        data: report,
        generated: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("❌ Error generating attribution report:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

