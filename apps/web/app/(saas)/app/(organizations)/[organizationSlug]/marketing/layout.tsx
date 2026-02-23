import { getActiveOrganization } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { MarketingSidebar } from "./components/marketing-sidebar";

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

	return (
		<div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-950">
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
	);
}
