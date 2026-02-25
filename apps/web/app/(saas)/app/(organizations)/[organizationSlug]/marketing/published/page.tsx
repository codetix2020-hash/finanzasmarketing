import { redirect } from "next/navigation";

export default async function PublishedPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/marketing/content?tab=published`);
}
