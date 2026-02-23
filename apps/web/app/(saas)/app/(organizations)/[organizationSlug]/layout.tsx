import { config } from "@repo/config";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { activeOrganizationQueryKey } from "@saas/organizations/lib/api";
import { AppWrapper } from "@saas/shared/components/AppWrapper";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { notFound, redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import Link from "next/link";
import { prisma } from "@repo/database";

function TrialBanner({
	daysLeft,
	organizationSlug,
}: {
	daysLeft: number;
	organizationSlug: string;
}) {
	if (daysLeft > 7) return null;

	return (
		<div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-500/20 px-4 py-2 text-center text-sm">
			<span className="text-purple-300">
				{daysLeft <= 1
					? "Your trial ends today. "
					: `${daysLeft} days left on your free trial. `}
			</span>
			<Link
				href={`/app/${organizationSlug}/settings/billing`}
				className="text-purple-400 font-medium hover:text-purple-300 underline ml-1"
			>
				Manage subscription →
			</Link>
		</div>
	);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizationLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{
		organizationSlug: string;
	}>;
}>) {
	const { organizationSlug } = await params;

	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	let daysLeft = 0;
	let showTrialBanner = false;

	const subscription = await prisma.d2CSubscription.findUnique({
		where: { organizationId: organization.id },
	});

	let hasAccess = false;

	if (subscription) {
		if (subscription.status === "active") {
			hasAccess = true;
		} else if (subscription.status === "trialing") {
			const endDate = subscription.trialEndsAt ?? subscription.currentPeriodEnd;
			if (endDate && new Date() < endDate) {
				hasAccess = true;
				daysLeft = Math.max(
					0,
					Math.ceil(
						(endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
					),
				);
				showTrialBanner = true;
			}
		}
	}

	if (!hasAccess) {
		redirect("/billing/choose-plan");
	}

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: activeOrganizationQueryKey(organizationSlug),
		queryFn: () => organization,
	});

	if (config.users.enableBilling) {
		await queryClient.prefetchQuery(
			orpc.payments.listPurchases.queryOptions({
				input: {
					organizationId: organization.id,
				},
			}),
		);
	}

	return (
		<>
			{showTrialBanner && (
				<TrialBanner daysLeft={daysLeft} organizationSlug={organizationSlug} />
			)}
			<AppWrapper>{children}</AppWrapper>
		</>
	);
}
