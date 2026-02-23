import { getActiveOrganization } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { MarketingSidebar } from "./components/marketing-sidebar";
import Link from "next/link";
import {
	checkSubscription,
	type SubscriptionStatus,
} from "@repo/api/lib/subscription-guard";
import { ensureTrialSubscription } from "@repo/api/lib/trial-subscription";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function TrialBanner({ daysLeft }: { daysLeft: number }) {
	if (daysLeft > 7) return null;

	return (
		<div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/20 px-4 py-2 text-center">
			<span className="text-sm text-purple-300">
				{daysLeft <= 1
					? "Your trial ends today. "
					: `${daysLeft} days left on your free trial. `}
			</span>
			<Link
				href="/billing/upgrade"
				className="text-sm text-purple-400 font-medium hover:text-purple-300 underline"
			>
				Upgrade now →
			</Link>
		</div>
	);
}

export default async function MarketingLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string }>;
}>) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	let subscriptionStatus: SubscriptionStatus = await checkSubscription(
		organization.id,
	);

	// Backfill for old organizations created before trial initialization existed.
	if (!subscriptionStatus.active && subscriptionStatus.reason === "no_subscription") {
		await ensureTrialSubscription(organization.id);
		subscriptionStatus = await checkSubscription(organization.id);
	}

	if (!subscriptionStatus.active) {
		redirect("/billing/upgrade");
	}

	return (
		<div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
			{subscriptionStatus.isTrial && (
				<TrialBanner daysLeft={subscriptionStatus.daysLeft || 0} />
			)}
			<div className="flex min-h-screen">
				{/* Sidebar de MarketingOS */}
				<MarketingSidebar
					organizationSlug={organizationSlug}
					orgName={organization.name}
					orgLogo={organization.logo}
				/>

				{/* Contenido principal */}
				<main className="flex-1 ml-64 min-h-screen overflow-auto">
					<div className="p-6 md:p-8">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
