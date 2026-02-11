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
	MessageSquare,
	Settings,
	Sparkles,
	Send,
	Target,
	Building2,
	Plug,
	CreditCard,
	Wand2,
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
			title: "MarketingOS",
			avatar: (
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
						<BarChart3 className="w-5 h-5 text-white" />
					</div>
				</div>
			),
			items: [
				{
					title: "Dashboard",
					href: `${marketingBasePath}/dashboard`,
					icon: <LayoutDashboard className="size-4 opacity-50" />,
				},
				{
					title: "Automatización",
					href: `${marketingBasePath}/automation`,
					icon: <Bot className="size-4 opacity-50" />,
				},
				{
					title: "Asistente AI",
					href: `${marketingBasePath}/assistant`,
					icon: (
						<div className="relative">
							<MessageSquare className="size-4 opacity-50" />
							<span className="absolute -top-1 -right-1 flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
								<span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
							</span>
						</div>
					),
				},
			{
				title: "Generar contenido",
				href: `${marketingBasePath}/generate`,
				icon: <Wand2 className="size-4 opacity-50" />,
			},
			{
				title: "Contenido",
				href: `${marketingBasePath}/content`,
				icon: <Sparkles className="size-4 opacity-50" />,
			},
				{
					title: "Calendario",
					href: `${marketingBasePath}/content/calendar`,
					icon: <Calendar className="size-4 opacity-50" />,
				},
				{
					title: "Publicados",
					href: `${marketingBasePath}/published`,
					icon: <Send className="size-4 opacity-50" />,
				},
				{
					title: "Banco de Fotos",
					href: `${marketingBasePath}/media`,
					icon: <FileImage className="size-4 opacity-50" />,
				},
				{
					title: "Fotos de Marca",
					href: `${marketingBasePath}/brand-photos`,
					icon: <FileImage className="size-4 opacity-50" />,
				},
				{
					title: "SEO",
					href: `${marketingBasePath}/seo`,
					icon: <Target className="size-4 opacity-50" />,
				},
				{
					title: "Analytics",
					href: `${marketingBasePath}/analytics`,
					icon: <BarChart3 className="size-4 opacity-50" />,
				},
			],
		},
		{
			title: "Configuración",
			avatar: <Settings className="size-8 opacity-50" />,
			items: [
				{
					title: "Perfil empresa",
					href: `${marketingBasePath}/profile`,
					icon: <Building2 className="size-4 opacity-50" />,
				},
				{
					title: "Integraciones",
					href: `/app/${organizationSlug}/settings/integrations`,
					icon: <Plug className="size-4 opacity-50" />,
				},
				{
					title: "Facturación",
					href: `/app/${organizationSlug}/settings/billing`,
					icon: <CreditCard className="size-4 opacity-50" />,
				},
			],
		},
	];

	return (
		<SidebarContentLayout
			sidebar={<SettingsMenu menuItems={menuItems} />}
		>
			{children}
		</SidebarContentLayout>
	);
}

