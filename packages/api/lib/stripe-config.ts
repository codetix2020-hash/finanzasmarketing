export const STRIPE_PRICES = {
	pro: {
		monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
		annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
	},
	agency: {
		monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || "",
		annual: process.env.STRIPE_PRICE_AGENCY_ANNUAL || "",
	},
} as const;

export const PLAN_LIMITS = {
	pro: { postsLimit: 60, brandsLimit: 1 },
	agency: { postsLimit: -1, brandsLimit: 5 },
} as const;

export type BillingPlan = keyof typeof STRIPE_PRICES;
export type BillingCycle = "monthly" | "annual";

export function getPlanFromPriceId(priceId: string): BillingPlan {
	if (
		priceId === STRIPE_PRICES.agency.monthly ||
		priceId === STRIPE_PRICES.agency.annual
	) {
		return "agency";
	}

	return "pro";
}
