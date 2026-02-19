export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    description: "Para probar",
    price: 0,
    priceId: null,
    limits: {
      postsPerMonth: 5,
      brands: 1,
      scheduledPosts: false,
      autoPublish: false,
      analytics: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "Para empezar a crecer",
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER || null,
    limits: {
      postsPerMonth: 30,
      brands: 1,
      scheduledPosts: true,
      autoPublish: false,
      analytics: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Para marcas en crecimiento",
    price: 79,
    priceId: process.env.STRIPE_PRICE_PRO || null,
    limits: {
      postsPerMonth: 100,
      brands: 3,
      scheduledPosts: true,
      autoPublish: true,
      analytics: true,
    },
  },
  business: {
    id: "business",
    name: "Business",
    description: "Para agencias y equipos",
    price: 199,
    priceId: process.env.STRIPE_PRICE_BUSINESS || null,
    limits: {
      postsPerMonth: -1, // ilimitado
      brands: 10,
      scheduledPosts: true,
      autoPublish: true,
      analytics: true,
      whiteLabel: true,
      apiAccess: true,
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

