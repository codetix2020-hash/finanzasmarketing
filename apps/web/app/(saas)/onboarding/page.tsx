import { config } from "@repo/config";
import { getSession } from "@saas/auth/lib/server";
import { OnboardingForm } from "@saas/onboarding/components/OnboardingForm";
import { AuthWrapper } from "@saas/shared/components/AuthWrapper";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("onboarding.title"),
	};
}

export default async function OnboardingPage() {
	console.log("=== ONBOARDING PAGE LOADED ===");
	
	try {
		// Después del OAuth, puede tomar un momento para que la sesión esté disponible
		// Intentar múltiples veces con retry (igual que /app)
		let session = null;
		let retries = 3;
		
		console.log("Attempting to get session...");
		
		while (!session && retries > 0) {
			try {
				session = await getSession();
				console.log(`Session attempt ${4 - retries} result:`, session ? "GOT IT" : "NOTHING");
				if (session) {
					console.log("Session details:", {
						userId: session.user?.id,
						email: session.user?.email,
						onboardingComplete: session.user?.onboardingComplete,
					});
					break;
				}
			} catch (sessionError) {
				console.log(`Session attempt ${4 - retries} error:`, sessionError);
				// Si falla, esperar un poco y reintentar
				if (retries > 1) {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}
			retries--;
		}

		console.log("Final session in onboarding:", session ? "EXISTS" : "NULL");
		console.log("Session user onboardingComplete:", session?.user?.onboardingComplete);
		console.log("Config enableOnboarding:", config.users.enableOnboarding);

		if (!session) {
			// Si después de varios intentos no hay sesión, redirigir a login
			console.log("About to redirect to: /en/login (no session)");
			redirect("/en/login");
		}

		// Si el onboarding está deshabilitado o ya está completo, redirigir a /app
		if (!config.users.enableOnboarding) {
			console.log("About to redirect to: /app (onboarding disabled)");
			redirect("/app");
		}

		if (session.user.onboardingComplete) {
			console.log("About to redirect to: /app (onboarding already complete)");
			redirect("/app");
		}

		console.log("Rendering OnboardingForm - session exists and onboarding not complete");
	} catch (error) {
		// Si hay error, redirigir a /app para que intente de nuevo
		console.error("Error obteniendo sesión en onboarding:", error);
		console.log("About to redirect to: /app (error occurred)");
		redirect("/app");
	}

	return (
		<AuthWrapper>
			<OnboardingForm />
		</AuthWrapper>
	);
}
