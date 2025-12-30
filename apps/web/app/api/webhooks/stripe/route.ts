import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { attributionTracker } from "@repo/api/modules/marketing/services/attribution-tracker";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

/**
 * Stripe Webhooks Handler
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe events and tracks conversions
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    console.error("❌ No Stripe signature found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`🔔 Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        console.log("💳 Payment failed:", event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed
 * User completed a purchase
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("💰 Checkout completed:", session.id);

  // Extract customer info
  const customerId = session.customer as string;
  const customerEmail = session.customer_email || session.customer_details?.email;
  const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert cents to euros

  // Extract metadata (campaign info if available)
  const metadata = session.metadata || {};
  const campaign = metadata.campaign || metadata.utm_campaign;
  const source = metadata.source || metadata.utm_source;
  const visitorId = metadata.visitorId || metadata.visitor_id;

  // Try to find userId from customer
  let userId = metadata.userId || customerId;

  try {
    // Track purchase event
    await attributionTracker.trackEvent({
      userId,
      visitorId: visitorId || `stripe_${customerId}`,
      sessionId: session.id,
      organizationId: metadata.organizationId,
      eventType: "purchase",
      eventValue: amount,
      campaign,
      source: source || "stripe",
      medium: "payment",
      metadata: {
        stripeSessionId: session.id,
        stripeCustomerId: customerId,
        customerEmail,
        mode: session.mode,
        paymentStatus: session.payment_status,
      },
    });

    // Calculate attribution if we have userId
    if (userId) {
      await attributionTracker.calculateAttribution(userId, amount);
      console.log(`✅ Attribution calculated for user ${userId}: €${amount}`);
    }
  } catch (error: any) {
    console.error("❌ Error tracking checkout:", error.message);
  }
}

/**
 * Handle customer.subscription.created
 * User started a trial or subscription
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("🎁 Subscription created:", subscription.id);

  const customerId = subscription.customer as string;
  const metadata = subscription.metadata || {};
  const campaign = metadata.campaign || metadata.utm_campaign;
  const source = metadata.source || metadata.utm_source;

  // Determine if it's a trial
  const isTrial = subscription.status === "trialing";
  const eventType = isTrial ? "trial_start" : "signup";

  try {
    await attributionTracker.trackEvent({
      userId: metadata.userId || customerId,
      visitorId: metadata.visitorId || `stripe_${customerId}`,
      sessionId: subscription.id,
      organizationId: metadata.organizationId,
      eventType,
      source: source || "stripe",
      campaign,
      medium: "subscription",
      metadata: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: subscription.status,
        planId: subscription.items.data[0]?.price.id,
        isTrial,
      },
    });

    console.log(`✅ ${eventType} tracked for customer ${customerId}`);
  } catch (error: any) {
    console.error("❌ Error tracking subscription:", error.message);
  }
}

/**
 * Handle invoice.paid
 * Recurring payment succeeded
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Skip if it's the first invoice (already tracked in checkout)
  if (invoice.billing_reason === "subscription_create") {
    return;
  }

  console.log("💳 Invoice paid:", invoice.id);

  const customerId = invoice.customer as string;
  const amount = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
  const subscriptionId = invoice.subscription as string;

  try {
    // Get subscription to extract metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const metadata = subscription.metadata || {};

    await attributionTracker.trackEvent({
      userId: metadata.userId || customerId,
      visitorId: metadata.visitorId || `stripe_${customerId}`,
      sessionId: invoice.id,
      organizationId: metadata.organizationId,
      eventType: "purchase",
      eventValue: amount,
      source: "stripe",
      campaign: metadata.campaign,
      medium: "recurring",
      metadata: {
        stripeInvoiceId: invoice.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        billingReason: invoice.billing_reason,
        isRecurring: true,
      },
    });

    // Update lifetime value
    if (metadata.userId) {
      await attributionTracker.calculateAttribution(metadata.userId, amount);
    }

    console.log(`✅ Recurring payment tracked: €${amount}`);
  } catch (error: any) {
    console.error("❌ Error tracking invoice:", error.message);
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
    },
  });
}

