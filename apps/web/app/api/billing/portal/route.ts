import { NextRequest, NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { prisma } from "@repo/database";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-10-29.clover",
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		const organizationId = session?.session?.activeOrganizationId;

		if (!organizationId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const sub = await prisma.d2CSubscription.findUnique({
			where: { organizationId },
		});

		if (!sub?.stripeCustomerId) {
			return NextResponse.json({ error: "No subscription found" }, { status: 404 });
		}

		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
		const portalSession = await stripe.billingPortal.sessions.create({
			customer: sub.stripeCustomerId,
			return_url: `${baseUrl}/app`,
		});

		return NextResponse.json({ url: portalSession.url });
	} catch (error) {
		console.error("Portal error:", error);
		return NextResponse.json(
			{ error: "Failed to create portal session" },
			{ status: 500 },
		);
	}
}

