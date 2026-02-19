import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { StripeService } from "@repo/api/modules/billing/stripe-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 }
      );
    }

    const authCtx = await getAuthContext(organizationId);
    if (!authCtx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const returnUrl = `${baseUrl}/app/${organizationId}/marketing/settings/billing`;

    const portalUrl = await StripeService.createBillingPortalSession(
      authCtx.organizationId,
      returnUrl
    );

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

