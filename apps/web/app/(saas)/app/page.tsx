import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const session = await getSession();

  if (!session) {
    redirect("/en/login");
  }

  let organizations: any[] = [];
  try {
    organizations = await getOrganizationList();
  } catch (error) {
    console.error("Error getting organizations:", error);
  }

  if (!organizations || organizations.length === 0) {
    redirect("/app/onboarding");
  }

  const firstOrg = organizations[0];
  redirect(`/app/${firstOrg.slug}/marketing/dashboard`);
}
