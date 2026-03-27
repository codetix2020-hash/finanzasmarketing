import { Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../src/components/PrimaryButton";
import Wrapper from "../src/components/Wrapper";
import { defaultLocale, defaultTranslations } from "../src/util/translations";
import type { BaseMailProps } from "../types";

export function OnboardingComplete({
	name,
	industry,
	brandTones,
	orgName,
	dashboardUrl,
	locale,
	translations,
}: {
	name: string;
	industry: string;
	brandTones: string;
	orgName: string;
	dashboardUrl: string;
} & BaseMailProps) {
	const t = createTranslator({
		locale,
		messages: translations,
	});

	return (
		<Wrapper>
			<Text>
				{t("mail.onboardingComplete.body", {
					name,
					orgName,
					industry,
					brandTones,
				})}
			</Text>

			<PrimaryButton href={dashboardUrl}>
				{t("mail.onboardingComplete.cta")} &rarr;
			</PrimaryButton>

			<Text className="text-muted-foreground text-sm">
				{t("mail.common.openLinkInBrowser")}
				<Link href={dashboardUrl}>{dashboardUrl}</Link>
			</Text>
		</Wrapper>
	);
}

OnboardingComplete.PreviewProps = {
	locale: defaultLocale,
	translations: defaultTranslations,
	name: "John",
	industry: "marketing",
	brandTones: "friendly and confident",
	orgName: "Acme",
	dashboardUrl: "#",
};

export default OnboardingComplete;
