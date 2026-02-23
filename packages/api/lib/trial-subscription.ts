import { prisma } from "@repo/database";

const TRIAL_DAYS = 14;

export function getTrialWindow(days = TRIAL_DAYS) {
	const currentPeriodStart = new Date();
	const trialEndsAt = new Date(currentPeriodStart);
	trialEndsAt.setDate(trialEndsAt.getDate() + days);

	return { currentPeriodStart, trialEndsAt };
}

export async function ensureTrialSubscription(organizationId: string) {
	const existing = await prisma.d2CSubscription.findUnique({
		where: { organizationId },
	});

	if (existing) return existing;

	const { currentPeriodStart, trialEndsAt } = getTrialWindow();

	return prisma.d2CSubscription.create({
		data: {
			organizationId,
			status: "trialing",
			plan: "pro",
			postsLimit: 60,
			brandsLimit: 1,
			currentPeriodStart,
			currentPeriodEnd: trialEndsAt,
			trialStart: currentPeriodStart,
			trialEnd: trialEndsAt,
			trialEndsAt,
		},
	});
}
