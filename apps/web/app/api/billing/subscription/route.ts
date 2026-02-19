import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { PLANS } from "@repo/api/modules/billing/plans";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

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

    const subscription = await prisma.d2CSubscription.findUnique({
      where: { organizationId: authCtx.organizationId },
    });

    // Contar posts del mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const postsUsed = await prisma.generatedPost.count({
      where: {
        organizationId: authCtx.organizationId,
        createdAt: { gte: startOfMonth },
      },
    });

    const plan = subscription?.plan || "free";
    const planInfo = PLANS[plan as keyof typeof PLANS] || PLANS.free;

    return NextResponse.json({
      subscription: subscription || {
        plan: "free",
        status: "active",
        postsLimit: PLANS.free.limits.postsPerMonth,
      },
      usage: {
        postsUsed,
        postsLimit: subscription?.postsLimit || PLANS.free.limits.postsPerMonth,
      },
      planInfo,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

