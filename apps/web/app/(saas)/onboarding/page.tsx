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
	try {
		// Después del OAuth, puede tomar un momento para que la sesión esté disponible
		// Intentar múltiples veces con retry (igual que /app)
		let session = null;
		let retries = 3;
		
		while (!session && retries > 0) {
			try {
				session = await getSession();
				if (session) break;
			} catch (sessionError) {
				// Si falla, esperar un poco y reintentar
				if (retries > 1) {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}
			retries--;
		}

		if (!session) {
			// Si después de varios intentos no hay sesión, redirigir a login
			redirect("/en/login");
		}

		// Si el onboarding está deshabilitado o ya está completo, redirigir a /app
		if (!config.users.enableOnboarding || session.user.onboardingComplete) {
			redirect("/app");
		}
	} catch (error) {
		// Si hay error, redirigir a /app para que intente de nuevo
		console.error("Error obteniendo sesión en onboarding:", error);
		redirect("/app");
	}

	return (
		<AuthWrapper>
			<OnboardingForm />
		</AuthWrapper>
	);
}
