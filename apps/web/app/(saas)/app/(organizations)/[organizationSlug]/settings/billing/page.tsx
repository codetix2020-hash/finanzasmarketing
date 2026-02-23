import { getActiveOrganization } from "@saas/auth/lib/server";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ManageSubscriptionButton } from "./manage-subscription-button";
import { prisma } from "@repo/database";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("settings.billing.title"),
	};
}

export default async function BillingSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	const subscription = await prisma.d2CSubscription.findUnique({
		where: { organizationId: organization.id },
	});

	const trialEnd = subscription?.trialEndsAt ?? subscription?.currentPeriodEnd ?? null;
	const trialDaysLeft = trialEnd
		? Math.max(
				0,
				Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
			)
		: 0;

	return (
		<SettingsList>
			<div className="max-w-2xl">
				<h1 className="text-2xl font-bold mb-6">Billing</h1>

				<div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
					<h2 className="text-sm font-medium text-zinc-500 mb-4">Your plan</h2>

					{subscription?.status === "active" && (
						<div>
							<div className="flex items-center gap-3 mb-2">
								<span className="text-xl font-bold capitalize">{subscription.plan}</span>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
									ACTIVE
								</span>
							</div>
							{subscription.currentPeriodEnd && (
								<p className="text-sm text-zinc-500">
									Next billing date:{" "}
									{new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
										month: "long",
										day: "numeric",
										year: "numeric",
									})}
								</p>
							)}
							{subscription.cancelAtPeriodEnd && (
								<p className="text-sm text-orange-500 mt-1">
									Your subscription will cancel at the end of the current period.
								</p>
							)}
						</div>
					)}

					{subscription?.status === "trialing" && (
						<div>
							<div className="flex items-center gap-3 mb-2">
								<span className="text-xl font-bold capitalize">{subscription.plan}</span>
								<span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-medium">
									FREE TRIAL
								</span>
							</div>
							{trialEnd && (
								<>
									<p className="text-sm text-zinc-500">
										Trial ends:{" "}
										{new Date(trialEnd).toLocaleDateString("en-US", {
											month: "long",
											day: "numeric",
											year: "numeric",
										})}{" "}
										({trialDaysLeft} days remaining)
									</p>
									<p className="text-xs text-zinc-400 mt-1">
										Your card will be charged automatically when the trial ends.
									</p>
								</>
							)}
						</div>
					)}

					{(!subscription ||
						subscription.status === "canceled" ||
						subscription.status === "expired" ||
						subscription.status === "past_due") && (
						<div>
							<p className="text-zinc-500 mb-4">No active plan</p>
							<a
								href="/billing/choose-plan"
								className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
							>
								Choose a plan →
							</a>
						</div>
					)}

					{subscription?.stripeCustomerId && (
						<div className="mt-4">
							<ManageSubscriptionButton />
						</div>
					)}
				</div>
			</div>
		</SettingsList>
	);
}
