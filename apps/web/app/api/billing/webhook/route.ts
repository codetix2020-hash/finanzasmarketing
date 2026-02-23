import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Stripe from "stripe";
import {
	PLAN_LIMITS,
	getPlanFromPriceId,
	type BillingPlan,
} from "@repo/api/lib/stripe-config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-10-29.clover",
});

const webhookSecret =
	process.env.STRIPE_BILLING_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
	try {
		const payload = await request.text();
		const signature = request.headers.get("stripe-signature");

		if (!signature || !webhookSecret) {
			return NextResponse.json({ error: "Invalid webhook setup" }, { status: 400 });
		}

		let event: Stripe.Event;
		try {
			event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
		} catch (error) {
			console.error("Webhook signature verification failed:", error);
			return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
		}

		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				const organizationId = session.metadata?.organizationId;
				const plan = (session.metadata?.plan as BillingPlan | undefined) || "pro";

				if (!organizationId) break;

				const stripeSubscription = await stripe.subscriptions.retrieve(
					session.subscription as string,
				);
				const stripeSubscriptionAny = stripeSubscription as any;
				const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.pro;
				const status =
					stripeSubscription.status === "trialing" ? "trialing" : "active";
				const trialEndsAt =
					stripeSubscription.trial_end
						? new Date(stripeSubscription.trial_end * 1000)
						: null;

				await prisma.d2CSubscription.upsert({
					where: { organizationId },
					update: {
						status,
						plan,
						stripeCustomerId: session.customer as string,
						stripeSubscriptionId: stripeSubscription.id,
						stripePriceId: stripeSubscription.items.data[0]?.price.id || null,
						postsLimit: limits.postsLimit,
						brandsLimit: limits.brandsLimit,
						trialEndsAt,
						currentPeriodStart: stripeSubscriptionAny.current_period_start
							? new Date(stripeSubscriptionAny.current_period_start * 1000)
							: new Date(),
						currentPeriodEnd: stripeSubscriptionAny.current_period_end
							? new Date(stripeSubscriptionAny.current_period_end * 1000)
							: null,
						trialEnd: trialEndsAt,
					},
					create: {
						organizationId,
						status,
						plan,
						stripeCustomerId: session.customer as string,
						stripeSubscriptionId: stripeSubscription.id,
						stripePriceId: stripeSubscription.items.data[0]?.price.id || null,
						postsLimit: limits.postsLimit,
						brandsLimit: limits.brandsLimit,
						trialEndsAt,
						currentPeriodStart: stripeSubscriptionAny.current_period_start
							? new Date(stripeSubscriptionAny.current_period_start * 1000)
							: new Date(),
						currentPeriodEnd: stripeSubscriptionAny.current_period_end
							? new Date(stripeSubscriptionAny.current_period_end * 1000)
							: null,
						trialEnd: trialEndsAt,
					},
				});
				break;
			}

			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				const organizationId = subscription.metadata?.organizationId;
				if (!organizationId) break;

				const priceId = subscription.items.data[0]?.price.id;
				const plan = priceId ? getPlanFromPriceId(priceId) : "pro";
				const limits = PLAN_LIMITS[plan];
				let status: string;
				let trialEndsAt: Date | null = null;

				switch (subscription.status) {
					case "active":
						status = "active";
						break;
					case "trialing":
						status = "trialing";
						if (subscription.trial_end) {
							trialEndsAt = new Date(subscription.trial_end * 1000);
						}
						break;
					case "past_due":
						status = "past_due";
						break;
					case "canceled":
					case "unpaid":
						status = "canceled";
						break;
					default:
						status = "canceled";
				}

				await prisma.d2CSubscription.update({
					where: { organizationId },
					data: {
						status,
						plan,
						stripePriceId: priceId || null,
						postsLimit: limits.postsLimit,
						brandsLimit: limits.brandsLimit,
						trialEndsAt,
						currentPeriodStart: (subscription as any).current_period_start
							? new Date((subscription as any).current_period_start * 1000)
							: new Date(),
						currentPeriodEnd: (subscription as any).current_period_end
							? new Date((subscription as any).current_period_end * 1000)
							: null,
						cancelAtPeriodEnd: subscription.cancel_at_period_end,
						trialStart: subscription.trial_start
							? new Date(subscription.trial_start * 1000)
							: null,
						trialEnd: subscription.trial_end
							? new Date(subscription.trial_end * 1000)
							: null,
					},
				});
				break;
			}

			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				const organizationId = subscription.metadata?.organizationId;
				if (!organizationId) break;

				await prisma.d2CSubscription.update({
					where: { organizationId },
					data: {
						status: "canceled",
						stripeSubscriptionId: null,
						stripePriceId: null,
					},
				});
				break;
			}

			case "invoice.payment_failed": {
				const invoice = event.data.object as Stripe.Invoice;
				const subscriptionId = (invoice as any).subscription as string;
				if (!subscriptionId) break;

				const sub = await prisma.d2CSubscription.findFirst({
					where: { stripeSubscriptionId: subscriptionId },
				});
				if (sub) {
					await prisma.d2CSubscription.update({
						where: { id: sub.id },
						data: { status: "past_due" },
					});
				}
				break;
			}
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("Webhook error:", error);
		return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
	}
}

