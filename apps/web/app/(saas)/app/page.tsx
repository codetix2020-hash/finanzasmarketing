import { getOrganizationList, getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  console.log("=== /app page loaded ===");

  // Get session
  const session = await getSession();
  console.log("Session:", session ? "EXISTS" : "NULL");

  if (!session) {
    console.log("No session, redirecting to login");
    redirect("/en/login");
  }

  // Get organizations
  let organizations: any[] = [];
  try {
    organizations = await getOrganizationList();
    console.log("Organizations:", organizations.length);
  } catch (error) {
    console.error("Error getting organizations:", error);
  }

  // If no organizations, go to onboarding
  if (!organizations || organizations.length === 0) {
    console.log("No organizations, redirecting to onboarding");
    redirect("/app/onboarding");
  }

  // Has organizations, go to first org's dashboard
  const firstOrg = organizations[0];
  console.log("Redirecting to org:", firstOrg.slug);
  redirect(`/app/${firstOrg.slug}/marketing/dashboard`);
}
