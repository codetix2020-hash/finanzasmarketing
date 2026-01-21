import { config } from "@repo/config";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export default async function AppPage() {
	try {
		// Intentar obtener sesión (puede fallar en desarrollo si no hay DB configurada)
		const session = await getSession();

		if (!session) {
			// En desarrollo sin autenticación, redirigir a login
			// En producción, esto debería funcionar correctamente
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
	} catch (error) {
		// En desarrollo, si falla la autenticación (DB no configurada, etc.)
		// Redirigir a login para que el usuario pueda autenticarse
		console.error("Error en AppPage (probablemente desarrollo sin DB):", error);
		redirect("/en/login");
	}
}

