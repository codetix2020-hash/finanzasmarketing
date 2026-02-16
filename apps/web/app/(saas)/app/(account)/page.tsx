import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export default async function AppStartPage() {
	// Obtener sesión del usuario
	let session = null;
	try {
		session = await getSession();
	} catch (error) {
		console.warn("No se pudo obtener sesión:", error);
	}

	if (!session?.user) {
		redirect("/auth/login");
		return null;
	}

	// Buscar la primera organización del usuario y redirigir al dashboard
	try {
		const organizations = await getOrganizationList();

		if (organizations && organizations.length > 0) {
			const org = organizations[0];
			redirect(`/app/${org.slug}/marketing/dashboard`);
		}
	} catch (error) {
		console.warn("No se pudieron obtener organizaciones:", error);
	}

	// Si no tiene organización, ir a crear una
	redirect("/new-organization");
}
