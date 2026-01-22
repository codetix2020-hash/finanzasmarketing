import { config } from "@repo/config";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export default async function AppPage() {
	console.log("=== /app page loaded ===");
	
	try {
		// Después del OAuth, puede tomar un momento para que la sesión esté disponible
		// Intentar múltiples veces con retry
		let session = null;
		let retries = 3;
		
		while (!session && retries > 0) {
			try {
				session = await getSession();
				console.log("Session attempt:", retries, "Result:", session ? "GOT SESSION" : "NO SESSION");
				if (session) break;
			} catch (sessionError) {
				console.log("Session error:", sessionError);
				// Si falla, esperar un poco y reintentar
				if (retries > 1) {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}
			retries--;
		}

		console.log("Final session:", session);

		if (!session) {
			console.log("No session, redirecting to login");
			redirect("/en/login");
		}

		// Obtener organizaciones del usuario
		let organizations = [];
		try {
			organizations = await getOrganizationList();
			console.log("Organizations:", organizations);
		} catch (orgError) {
			console.log("Org error:", orgError);
			// Si falla obtener organizaciones, puede ser un problema temporal
			console.warn("Error obteniendo organizaciones en /app:", orgError);
		}

		if (!organizations || organizations.length === 0) {
			console.log("No organizations, redirecting to onboarding");
			// No tiene organizaciones, ir a onboarding
			redirect("/app/onboarding");
		}

		// Tiene organizaciones, redirigir al dashboard de marketing de la primera
		const firstOrg = organizations[0];
		console.log("First org:", firstOrg);
		if (firstOrg.slug) {
			console.log("Redirecting to dashboard:", `/app/${firstOrg.slug}/marketing/dashboard`);
			redirect(`/app/${firstOrg.slug}/marketing/dashboard`);
		}

		// Si no tiene slug, ir a onboarding
		console.log("No org slug, redirecting to onboarding");
		redirect("/app/onboarding");
	} catch (error) {
		// Si hay error, redirigir a login
		console.error("Error en AppPage:", error);
		redirect("/en/login");
	}
}

