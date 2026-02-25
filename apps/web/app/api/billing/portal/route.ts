import { NextRequest, NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { prisma } from "@repo/database";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-10-29.clover",
});

export async function POST(_request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let organizationId = session.session?.activeOrganizationId;

		if (!organizationId) {
			const membership = await prisma.member.findFirst({
				where: { userId: session.user.id },
				select: { organizationId: true },
			});
			organizationId = membership?.organizationId;
		}

		if (!organizationId) {
			return NextResponse.json({ error: "No organization found" }, { status: 400 });
		}

		const sub = await prisma.d2CSubscription.findUnique({
			where: { organizationId },
		});

		if (!sub?.stripeCustomerId) {
			return NextResponse.json({ error: "No subscription found" }, { status: 404 });
		}

		const org = await prisma.organization.findUnique({
			where: { id: organizationId },
			select: { slug: true },
		});

		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
		const portalSession = await stripe.billingPortal.sessions.create({
			customer: sub.stripeCustomerId,
			return_url: org?.slug
				? `${baseUrl}/app/${org.slug}/settings/billing`
				: `${baseUrl}/app`,
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

