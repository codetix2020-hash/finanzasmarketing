import { config } from "@repo/config";
import { SessionProvider } from "@saas/auth/components/SessionProvider";
import { sessionQueryKey } from "@saas/auth/lib/api";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { ActiveOrganizationProvider } from "@saas/organizations/components/ActiveOrganizationProvider";
import { organizationListQueryKey } from "@saas/organizations/lib/api";
import { ConfirmationAlertProvider } from "@saas/shared/components/ConfirmationAlertProvider";
import { Document } from "@shared/components/Document";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";

export default async function SaaSLayout({ children }: PropsWithChildren) {
	console.log("=== SAAS LAYOUT START ===");
	
	const locale = await getLocale();
	const messages = await getMessages();
	
	// Intentar obtener sesión real (funciona en producción, puede fallar en desarrollo)
	let session = null;
	try {
		session = await getSession();
		console.log("SAAS LAYOUT - session:", session ? "EXISTS" : "NULL");
	} catch (error) {
		// En desarrollo sin DB configurada, session será null
		console.warn("No se pudo obtener sesión (desarrollo sin DB?):", error);
		console.log("SAAS LAYOUT - session after error: NULL");
	}

	const queryClient = getServerQueryClient();

	// Prefetch queries con sesión real o null
	await queryClient.prefetchQuery({
		queryKey: sessionQueryKey,
		queryFn: () => session,
	});

	if (config.organizations.enable) {
		try {
			await queryClient.prefetchQuery({
				queryKey: organizationListQueryKey,
				queryFn: getOrganizationList,
			});
		} catch (error) {
			// En desarrollo sin DB, esto puede fallar - está bien
			console.warn("No se pudieron obtener organizaciones (desarrollo sin DB?):", error);
		}
	}

	if (config.users.enableBilling) {
		await queryClient.prefetchQuery(
			orpc.payments.listPurchases.queryOptions({
				input: {},
			}),
		);
	}

	console.log("=== SAAS LAYOUT RENDERING ===");

	return (
		<Document locale={locale}>
			<NextIntlClientProvider messages={messages}>
				<HydrationBoundary state={dehydrate(queryClient)}>
					<SessionProvider>
						<ActiveOrganizationProvider>
							<ConfirmationAlertProvider>
								{children}
							</ConfirmationAlertProvider>
						</ActiveOrganizationProvider>
					</SessionProvider>
				</HydrationBoundary>
			</NextIntlClientProvider>
		</Document>
	);
}
