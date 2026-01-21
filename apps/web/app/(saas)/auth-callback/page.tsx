import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

/**
 * Página de callback después del OAuth
 * Better Auth redirige aquí después del login exitoso
 * Esta página determina el redirect final basado en las organizaciones del usuario
 */
export default async function AuthCallbackPage() {
	try {
		// Esperar un momento para que la sesión esté disponible
		// (puede tomar un momento después del OAuth callback)
		await new Promise((resolve) => setTimeout(resolve, 100));

		const session = await getSession();

		if (!session) {
			// Si no hay sesión, redirigir a login
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
		// Si hay error, redirigir a /app que manejará el redirect
		console.error("Error en AuthCallbackPage:", error);
		redirect("/app");
	}
}

