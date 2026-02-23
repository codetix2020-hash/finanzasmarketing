import { NextRequest, NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { prisma } from "@repo/database";
import Stripe from "stripe";
import {
	PLAN_LIMITS,
	STRIPE_PRICES,
	type BillingCycle,
	type BillingPlan,
} from "@repo/api/lib/stripe-config";
import { ensureTrialSubscription } from "@repo/api/lib/trial-subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-10-29.clover",
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const planRaw = body?.plan ?? body?.planId;
		const billingRaw = body?.billing ?? "monthly";

		const plan = String(planRaw) as BillingPlan;
		const billing = String(billingRaw) as BillingCycle;

		if (!["pro", "agency"].includes(plan) || !["monthly", "annual"].includes(billing)) {
			return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });
		}

		const session = await auth.api.getSession({ headers: request.headers });
		const organizationId = session?.session?.activeOrganizationId;

		if (!session?.user?.id || !organizationId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!session.user.email) {
			return NextResponse.json({ error: "User email is required" }, { status: 400 });
		}

		const priceId = STRIPE_PRICES[plan][billing];
		if (!priceId) {
			return NextResponse.json({ error: "Price ID not configured" }, { status: 500 });
		}

		const org = await prisma.organization.findUnique({
			where: { id: organizationId },
			select: { slug: true },
		});
		if (!org?.slug) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		const sub = await ensureTrialSubscription(organizationId);
		let customerId = sub.stripeCustomerId;

		if (!customerId) {
			const customer = await stripe.customers.create({
				email: session.user.email,
				name: session.user.name || undefined,
				metadata: {
					organizationId,
					userId: session.user.id,
				},
			});

			customerId = customer.id;
			await prisma.d2CSubscription.update({
				where: { organizationId },
				data: { stripeCustomerId: customerId },
			});
		}

		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
		const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
		const cancelUrl = `${baseUrl}/billing/upgrade`;

		const checkoutSession = await stripe.checkout.sessions.create({
			customer: customerId,
			mode: "subscription",
			payment_method_types: ["card"],
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: successUrl,
			cancel_url: cancelUrl,
			metadata: {
				organizationId,
				plan,
				billing,
			},
			subscription_data: {
				metadata: {
					organizationId,
					plan,
				},
			},
			allow_promotion_codes: true,
		});

		// Persist the chosen limits early for better UX until webhook confirms activation.
		const limits = PLAN_LIMITS[plan];
		await prisma.d2CSubscription.update({
			where: { organizationId },
			data: {
				plan,
				postsLimit: limits.postsLimit,
				brandsLimit: limits.brandsLimit,
			},
		});

		return NextResponse.json({ url: checkoutSession.url });
	} catch (error) {
		console.error("Checkout error:", error);
		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 },
		);
	}
}

