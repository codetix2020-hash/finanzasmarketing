"use client";
import { useRouter } from "@shared/hooks/router";
import { Progress } from "@ui/components/progress";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { withQuery } from "ufo";
import { OnboardingStep1 } from "./OnboardingStep1";
import { OnboardingStep2 } from "./OnboardingStep2";

export function OnboardingForm() {
	const t = useTranslations();
	const router = useRouter();
	const searchParams = useSearchParams();

	const stepSearchParam = searchParams.get("step");
	const redirectTo = searchParams.get("redirectTo");
	const onboardingStep = stepSearchParam
		? Number.parseInt(stepSearchParam, 10)
		: 1;

	const setStep = (step: number) => {
		router.replace(
			withQuery(window.location.search ?? "", {
				step,
			}),
		);
	};

	// Paso 1 solo avanza al paso 2
	const onStep1Completed = () => {
		setStep(2);
	};

	// Paso 2 crea la organización y redirige (manejado en OnboardingStep2)
	const onStep2Completed = () => {
		// Esta función se llama desde OnboardingStep2 después de crear la organización
		// La redirección se maneja en OnboardingStep2
	};

	const steps = [
		{
			component: <OnboardingStep1 onCompleted={onStep1Completed} />,
		},
		{
			component: <OnboardingStep2 onCompleted={onStep2Completed} />,
		},
	];

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">
				{t("onboarding.title")}
			</h1>
			<p className="mt-2 mb-6 text-foreground/60">
				{t("onboarding.message")}
			</p>

			{steps.length > 1 && (
				<div className="mb-6 flex items-center gap-3">
					<Progress
						value={(onboardingStep / steps.length) * 100}
						className="h-2"
					/>
					<span className="shrink-0 text-foreground/60 text-xs">
						{t("onboarding.step", {
							step: onboardingStep,
							total: steps.length,
						})}
					</span>
				</div>
			)}

			{steps[onboardingStep - 1].component}
		</div>
	);
}
