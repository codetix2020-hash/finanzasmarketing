import { prisma } from "@repo/database";

export type SubscriptionStatus =
	| { active: true; plan: string; daysLeft?: number; isTrial: boolean }
	| {
			active: false;
			reason: "no_subscription" | "trial_expired" | "canceled" | "past_due";
	  };

export async function checkSubscription(
	organizationId: string,
): Promise<SubscriptionStatus> {
	const sub = await prisma.d2CSubscription.findUnique({
		where: { organizationId },
	});

	if (!sub) {
		return { active: false, reason: "no_subscription" };
	}

	if (sub.status === "active") {
		return { active: true, plan: sub.plan, isTrial: false };
	}

	if (sub.status === "trialing") {
		const trialEnd = sub.trialEndsAt ?? sub.trialEnd;

		if (!trialEnd) {
			return { active: true, plan: sub.plan, isTrial: true };
		}

		const now = new Date();
		if (now < trialEnd) {
			const daysLeft = Math.max(
				0,
				Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
			);
			return { active: true, plan: sub.plan, daysLeft, isTrial: true };
		}

		await prisma.d2CSubscription.update({
			where: { organizationId },
			data: { status: "expired" },
		});
		return { active: false, reason: "trial_expired" };
	}

	if (sub.status === "past_due") {
		return { active: false, reason: "past_due" };
	}

	if (sub.status === "canceled" || sub.status === "expired") {
		return { active: false, reason: "canceled" };
	}

	return { active: false, reason: "no_subscription" };
}
