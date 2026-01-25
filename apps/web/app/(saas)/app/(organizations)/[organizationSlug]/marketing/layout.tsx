import { getActiveOrganization } from "@saas/auth/lib/server";
import { OrganizationLogo } from "@saas/organizations/components/OrganizationLogo";
import { SettingsMenu } from "@saas/settings/components/SettingsMenu";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { SidebarContentLayout } from "@saas/shared/components/SidebarContentLayout";
import {
	BarChart3,
	Bot,
	Calendar,
	FileImage,
	LayoutDashboard,
	Megaphone,
	Settings,
	Sparkles,
	TrendingUp,
	Plug,
	CircleAlert,
} from "lucide-react";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { getBusinessProfile } from "@repo/database";

export default async function MarketingLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string }>;
}>) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	const businessProfile = await getBusinessProfile(organization.id);
	const isProfileComplete = businessProfile?.isComplete ?? false;

	const marketingBasePath = `/app/${organizationSlug}/marketing`;

	const menuItems = [
		{
			title: "Marketing",
			avatar: (
				<OrganizationLogo
					name={organization.name}
					logoUrl={organization.logo}
				/>
			),
			items: [
				{
					title: "Dashboard",
					href: `${marketingBasePath}/dashboard`,
					icon: <LayoutDashboard className="size-4 opacity-50" />,
				},
				{
					title: "Asistente AI",
					href: `${marketingBasePath}/assistant`,
					icon: (
						<div className="relative">
							<Bot className="size-4 opacity-50" />
							<span className="absolute -top-1 -right-1 flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
								<span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
							</span>
						</div>
					),
				},
				{
					title: "Contenido",
					href: `${marketingBasePath}/content`,
					icon: <Megaphone className="size-4 opacity-50" />,
				},
				{
					title: "Calendario",
					href: `${marketingBasePath}/calendar`,
					icon: <Calendar className="size-4 opacity-50" />,
				},
				{
					title: "Publicados",
					href: `${marketingBasePath}/published`,
					icon: <TrendingUp className="size-4 opacity-50" />,
				},
				{
					title: "Banco de Fotos",
					href: `${marketingBasePath}/media`,
					icon: <FileImage className="size-4 opacity-50" />,
				},
				{
					title: "SEO",
					href: `${marketingBasePath}/seo`,
					icon: (
						<div className="relative">
							<BarChart3 className="size-4 opacity-50" />
							<span className="absolute -top-1 -right-1 flex h-2 w-2">
								<span className="relative inline-flex h-2 w-2 rounded-full bg-muted"></span>
							</span>
						</div>
					),
				},
				{
					title: "Analytics",
					href: `${marketingBasePath}/analytics`,
					icon: <BarChart3 className="size-4 opacity-50" />,
				},
				{
					title: "Configuración",
					href: `${marketingBasePath}/settings`,
					icon: <Settings className="size-4 opacity-50" />,
				},
			],
		},
		{
			title: "Configuración",
			avatar: <Settings className="size-8 opacity-50" />,
			items: [
				{
					title: "Perfil de empresa",
					href: `${marketingBasePath}/profile`,
					icon: (
						<div className="relative">
							<Sparkles className="size-4 opacity-50" />
							{!isProfileComplete && (
								<span className="absolute -top-1 -right-1 flex h-2 w-2">
									<span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
								</span>
							)}
						</div>
					),
				},
				{
					title: "Integraciones",
					href: `/app/${organizationSlug}/settings/integrations`,
					icon: <Plug className="size-4 opacity-50" />,
				},
			],
		},
	];

	return (
		<>
			<PageHeader
				title="Marketing"
				subtitle="Gestiona tu contenido y campañas de marketing"
			/>
			<SidebarContentLayout
				sidebar={<SettingsMenu menuItems={menuItems} />}
			>
				{children}
			</SidebarContentLayout>
		</>
	);
}

