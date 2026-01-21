import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export default async function AppPage() {
	const session = await getSession();

	if (!session) {
		redirect("/en/login");
	}

	// Obtener organizaciones del usuario
	const organizations = await getOrganizationList();

	if (!organizations || organizations.length === 0) {
		// No tiene organizaciones, ir a onboarding
		redirect("/app/onboarding");
	}

	// Tiene organizaciones, redirigir al dashboard de marketing de la primera
	const firstOrg = organizations[0];
	if (firstOrg.slug) {
		redirect(`/app/${firstOrg.slug}/marketing/dashboard`);
	}

	// Si no tiene slug, ir a onboarding
	redirect("/app/onboarding");
}

