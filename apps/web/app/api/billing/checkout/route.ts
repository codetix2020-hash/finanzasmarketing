import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { StripeService } from "@repo/api/modules/billing/stripe-service";
import { type PlanId } from "@repo/api/modules/billing/plans";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { prisma } from "@repo/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, planId } = body;

    if (!organizationId || !planId) {
      return NextResponse.json(
        { error: "organizationId and planId required" },
        { status: 400 }
      );
    }

    // Validar planId
    const validPlans: PlanId[] = ["pro", "agency"];
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Verificar autorización
    const authCtx = await getAuthContext(organizationId);
    if (!authCtx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener email del usuario
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    // Obtener slug de la organización para la URL de redirect
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { slug: true },
    });

    if (!org?.slug) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const successUrl = `${baseUrl}/app/${org.slug}/marketing/settings/billing?success=true`;
    const cancelUrl = `${baseUrl}/app/${org.slug}/marketing/settings/billing?canceled=true`;

    const checkoutUrl = await StripeService.createCheckoutSession(
      authCtx.organizationId,
      planId as PlanId,
      email,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

