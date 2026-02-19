export const PLANS = {
  free: {
    id: "free",
    name: "Free Trial",
    description: "14 días de prueba",
    price: 0,
    priceId: null,
    limits: {
      postsPerMonth: 10,
      brands: 1,
      scheduledPosts: true,
      autoPublish: true,
      analytics: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Para tu marca",
    price: 29,
    priceId: process.env.STRIPE_PRICE_PRO,
    limits: {
      postsPerMonth: 60,
      brands: 1,
      scheduledPosts: true,
      autoPublish: true,
      analytics: true,
    },
  },
  agency: {
    id: "agency",
    name: "Agency",
    description: "Para gestionar clientes",
    price: 79,
    priceId: process.env.STRIPE_PRICE_AGENCY,
    limits: {
      postsPerMonth: -1, // ilimitado
      brands: 5,
      scheduledPosts: true,
      autoPublish: true,
      analytics: true,
      prioritySupport: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanLimits(planId: PlanId) {
  return PLANS[planId]?.limits || PLANS.free.limits;
}

export function getPlanByPriceId(priceId: string): PlanId {
  for (const [id, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return id as PlanId;
  }
  return "free";
}
