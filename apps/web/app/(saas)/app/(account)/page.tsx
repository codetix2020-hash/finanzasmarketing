import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export default async function AppStartPage() {
	// Get user session
	let session = null;
	try {
		session = await getSession();
	} catch (error) {
		console.warn("Could not get session:", error);
	}

	if (!session?.user) {
		redirect("/auth/login");
		return null;
	}

	// Find first org and redirect to dashboard
	try {
		const organizations = await getOrganizationList();

		if (organizations && organizations.length > 0) {
			const org = organizations[0];
			redirect(`/app/${org.slug}/marketing/dashboard`);
		}
	} catch (error) {
		console.warn("Could not get organizations:", error);
	}

	// No organization found, redirect to onboarding
	redirect("/app/onboarding");
}
