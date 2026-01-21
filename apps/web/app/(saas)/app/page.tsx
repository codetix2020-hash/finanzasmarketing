import { config } from "@repo/config";
import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export default async function AppPage() {
	try {
		// Intentar obtener sesión (puede fallar en desarrollo si no hay DB configurada)
		// Después del OAuth, puede tomar un momento para que la sesión esté disponible
		let session = null;
		try {
			session = await getSession();
		} catch (sessionError) {
			// Si falla obtener la sesión, puede ser un problema temporal después del OAuth
			console.warn("Error obteniendo sesión en /app (puede ser temporal después de OAuth):", sessionError);
		}

		if (!session) {
			// Si no hay sesión, redirigir a login
			redirect("/en/login");
		}

		// Obtener organizaciones del usuario
		let organizations = [];
		try {
			organizations = await getOrganizationList();
		} catch (orgError) {
			// Si falla obtener organizaciones, puede ser un problema temporal
			console.warn("Error obteniendo organizaciones en /app:", orgError);
		}

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
		console.error("Error en AppPage:", error);
		redirect("/en/login");
	}
}

