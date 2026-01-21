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
		const session = await getSession();

		if (!session) {
			// Si no hay sesión, redirigir a login (pero con locale)
			redirect("/en/login");
		}

		// Si el onboarding está deshabilitado o ya está completo, redirigir a /app
		if (!config.users.enableOnboarding || session.user.onboardingComplete) {
			redirect("/app");
		}
	} catch (error) {
		// Si hay error obteniendo la sesión (puede pasar justo después del OAuth)
		// Esperar un momento y redirigir a /app para que intente de nuevo
		console.error("Error obteniendo sesión en onboarding:", error);
		redirect("/app");
	}

	return (
		<AuthWrapper>
			<OnboardingForm />
		</AuthWrapper>
	);
}
