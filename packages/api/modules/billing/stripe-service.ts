import Stripe from "stripe";
import { prisma } from "@repo/database";
import { PLANS, getPlanByPriceId, type PlanId } from "./plans";

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing env variable STRIPE_SECRET_KEY");
  }
  return new Stripe(secretKey);
}

export class StripeService {
  /**
   * Crear o obtener cliente de Stripe
   */
  static async getOrCreateCustomer(
    organizationId: string,
    email: string,
    name?: string
  ): Promise<string> {
    const stripe = getStripeClient();

    // Buscar suscripción existente
    const subscription = await prisma.d2CSubscription.findUnique({
      where: { organizationId },
    });

    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    // Crear nuevo cliente en Stripe
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        organizationId,
      },
    });

    // Guardar en DB
    await prisma.d2CSubscription.upsert({
      where: { organizationId },
      update: { stripeCustomerId: customer.id },
      create: {
        organizationId,
        stripeCustomerId: customer.id,
        plan: "free",
        status: "active",
        postsLimit: PLANS.free.limits.postsPerMonth,
        brandsLimit: PLANS.free.limits.brands,
      },
    });

    return customer.id;
  }

  /**
   * Crear sesión de checkout
   */
  static async createCheckoutSession(
    organizationId: string,
    planId: PlanId,
    email: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const stripe = getStripeClient();
    const plan = PLANS[planId];

    if (!plan.priceId) {
      throw new Error("Invalid plan");
    }

    const customerId = await this.getOrCreateCustomer(organizationId, email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          organizationId,
          planId,
        },
      },
      metadata: {
        organizationId,
        planId,
      },
    });

    return session.url!;
  }

  /**
   * Crear portal de facturación
   */
  static async createBillingPortalSession(
    organizationId: string,
    returnUrl: string
  ): Promise<string> {
    const stripe = getStripeClient();

    const subscription = await prisma.d2CSubscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error("No customer found");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Manejar webhook de Stripe
   */
  static async handleWebhook(
    payload: string,
    signature: string
  ): Promise<void> {
    const stripe = getStripeClient();

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_BILLING_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
    }
  }

  private static async handleCheckoutCompleted(
    session: Stripe.Checkout.Session
  ) {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) return;

    const planId = (session.metadata?.planId as PlanId) || "starter";
    const limits = PLANS[planId].limits;

    await prisma.d2CSubscription.update({
      where: { organizationId },
      data: {
        stripeSubscriptionId: session.subscription as string,
        plan: planId,
        status: "active",
        postsLimit: limits.postsPerMonth,
        brandsLimit: limits.brands,
      },
    });
  }

  private static async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ) {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    const priceId = subscription.items.data[0]?.price.id;
    const planId = priceId ? getPlanByPriceId(priceId) : "free";
    const limits = PLANS[planId].limits;

    await prisma.d2CSubscription.update({
      where: { organizationId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plan: planId,
        status:
          subscription.status === "active"
            ? "active"
            : subscription.status === "trialing"
              ? "trialing"
              : subscription.status === "past_due"
                ? "past_due"
                : "canceled",
        currentPeriodStart: new Date(
          subscription.current_period_start * 1000
        ),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        postsLimit: limits.postsPerMonth,
        brandsLimit: limits.brands,
      },
    });
  }

  private static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ) {
    const organizationId = subscription.metadata?.organizationId;
    if (!organizationId) return;

    const freeLimits = PLANS.free.limits;

    await prisma.d2CSubscription.update({
      where: { organizationId },
      data: {
        plan: "free",
        status: "canceled",
        stripeSubscriptionId: null,
        stripePriceId: null,
        postsLimit: freeLimits.postsPerMonth,
        brandsLimit: freeLimits.brands,
      },
    });
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const subscription = await prisma.d2CSubscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (subscription) {
      await prisma.d2CSubscription.update({
        where: { id: subscription.id },
        data: { status: "past_due" },
      });
    }
  }

  /**
   * Verificar si tiene acceso a una feature
   */
  static async hasFeatureAccess(
    organizationId: string,
    feature: string
  ): Promise<boolean> {
    const subscription = await prisma.d2CSubscription.findUnique({
      where: { organizationId },
    });

    const planId = (subscription?.plan || "free") as PlanId;
    const limits = PLANS[planId].limits as Record<string, unknown>;

    return !!limits[feature];
  }

  /**
   * Verificar límite de posts
   */
  static async canCreatePost(organizationId: string): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
  }> {
    const subscription = await prisma.d2CSubscription.findUnique({
      where: { organizationId },
    });

    const limit =
      subscription?.postsLimit || PLANS.free.limits.postsPerMonth;

    // Contar posts del mes actual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const used = await prisma.generatedPost.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      allowed: limit === -1 || used < limit,
      used,
      limit: limit === -1 ? Infinity : limit,
    };
  }
}

