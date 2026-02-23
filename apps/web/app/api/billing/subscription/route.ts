import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { PLANS } from "@repo/api/modules/billing/plans";
import { ensureTrialSubscription } from "@repo/api/lib/trial-subscription";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const organizationId = searchParams.get("organizationId");

		if (!organizationId) {
			return NextResponse.json(
				{ error: "organizationId required" },
				{ status: 400 },
			);
		}

		const authCtx = await getAuthContext(organizationId);
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const subscription = await ensureTrialSubscription(authCtx.organizationId);

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

		const plan = subscription.plan || "pro";
		const planInfo = PLANS[plan as keyof typeof PLANS] || PLANS.pro;

		return NextResponse.json({
			subscription,
			usage: {
				postsUsed,
				postsLimit: subscription.postsLimit || PLANS.pro.limits.postsPerMonth,
			},
			planInfo,
		});
	} catch (error) {
		console.error("Error fetching subscription:", error);
		return NextResponse.json(
			{ error: "Failed to fetch subscription" },
			{ status: 500 },
		);
	}
}

