import { redirect } from "next/navigation";

export default async function OrganizationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	// Redirigir directamente al dashboard de marketing
	redirect(`/app/${organizationSlug}/marketing/dashboard`);
}
