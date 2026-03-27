"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { OrganizationLogo } from "@saas/organizations/components/OrganizationLogo";
import { UserAvatar } from "@shared/components/UserAvatar";
import { cn } from "@ui/lib";
import {
	BarChart3,
	Bot,
	Building2,
	Calendar,
	Camera,
	CreditCard,
	FileText,
	ImageIcon,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	Plug,
	Search,
	Send,
	Settings,
	Sparkles,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";

interface MarketingSidebarProps {
	organizationSlug: string;
	orgName: string;
	orgLogo?: string | null;
}

function NavItem({
	href,
	icon: Icon,
	label,
	isActive,
	badge,
}: {
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	isActive: boolean;
	badge?: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className={cn(
				"flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
				isActive
					? "bg-violet-50 text-violet-700 font-medium border-l-2 border-l-violet-500"
					: "text-gray-600 hover:bg-gray-50",
			)}
		>
			<Icon className="h-4 w-4 shrink-0" />
			<span className="flex-1">{label}</span>
			{badge}
		</Link>
	);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<div className="pt-5 pb-2 px-3">
			<span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
				{children}
			</span>
		</div>
	);
}

export function MarketingSidebar({
	organizationSlug,
	orgName,
	orgLogo,
}: MarketingSidebarProps) {
	const pathname = usePathname();
	const { user } = useSession();
	const basePath = `/app/${organizationSlug}/marketing`;

	const isActive = (path: string) => {
		const fullPath = `${basePath}/${path}`;
		// Exact match for dashboard, includes for others
		if (path === "dashboard") {
			return pathname.endsWith("/marketing/dashboard");
		}
		return pathname.includes(fullPath.replace(basePath + "/", "/marketing/"));
	};

	const onLogout = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					window.location.href = new URL(
						config.auth.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	return (
		<aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40">
			{/* Logo MarketingOS */}
			<div className="p-4 border-b border-gray-100">
				<Link href={`${basePath}/dashboard`} className="flex items-center gap-2.5">
					<span className="font-bold text-lg text-gray-900">✦ PilotSocials</span>
				</Link>
			</div>

			{/* Selector de organización */}
			<div className="p-3 border-b border-gray-100">
				<div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50">
					<OrganizationLogo
						name={orgName}
						logoUrl={orgLogo}
						className="size-8"
					/>
					<span className="font-medium text-sm text-gray-900 truncate">
						{orgName}
					</span>
				</div>
			</div>

			{/* Navegación principal */}
			<nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
				<NavItem
					href={`${basePath}/dashboard`}
					icon={LayoutDashboard}
					label="Dashboard"
					isActive={isActive("dashboard")}
				/>
				<NavItem
					href={`${basePath}/automation`}
					icon={Zap}
					label="Automation"
					isActive={isActive("automation")}
				/>
				<NavItem
					href={`${basePath}/assistant`}
					icon={Bot}
					label="AI assistant"
					isActive={isActive("assistant")}
					badge={
						<span className="flex h-2 w-2">
							<span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-500 opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
						</span>
					}
				/>
				<NavItem
					href={`${basePath}/generate`}
					icon={Sparkles}
					label="Generate content"
					isActive={isActive("generate")}
				/>

				<SectionLabel>Content</SectionLabel>

				<NavItem
					href={`${basePath}/content`}
					icon={FileText}
					label="Content"
					isActive={isActive("content") && !isActive("content/calendar") && !isActive("content/create")}
				/>
				<NavItem
					href={`${basePath}/content/create`}
					icon={Sparkles}
					label="Create content"
					isActive={isActive("content/create")}
				/>
				<NavItem
					href={`${basePath}/content/calendar`}
					icon={Calendar}
					label="Calendar"
					isActive={isActive("content/calendar")}
				/>
				<NavItem
					href={`${basePath}/published`}
					icon={Send}
					label="Published"
					isActive={isActive("published")}
				/>
				<NavItem
					href={`${basePath}/media`}
					icon={ImageIcon}
					label="Photo library"
					isActive={isActive("media")}
				/>
				<NavItem
					href={`${basePath}/brand-photos`}
					icon={Camera}
					label="Brand photos"
					isActive={isActive("brand-photos")}
				/>

				<SectionLabel>Analytics</SectionLabel>

				<NavItem
					href={`${basePath}/seo`}
					icon={Search}
					label="SEO"
					isActive={isActive("seo")}
				/>
				<NavItem
					href={`${basePath}/analytics`}
					icon={BarChart3}
					label="Analytics"
					isActive={isActive("analytics")}
				/>
			</nav>

			{/* Configuración */}
			<div className="p-3 border-t border-gray-100 space-y-0.5">
				<NavItem
					href={`${basePath}/profile`}
					icon={Building2}
					label="Company profile"
					isActive={isActive("profile")}
				/>
				<NavItem
					href={`/app/${organizationSlug}/settings/integrations`}
					icon={Plug}
					label="Integrations"
					isActive={pathname.includes("/settings/integrations")}
				/>
				<NavItem
					href={`/app/${organizationSlug}/settings/billing`}
					icon={CreditCard}
					label="Billing"
					isActive={pathname.includes("/settings/billing")}
				/>
			</div>

			{/* Usuario */}
			{user && (
				<div className="p-3 border-t border-gray-100">
					<div className="flex items-center gap-3 p-2">
						<UserAvatar
							name={user.name ?? ""}
							avatarUrl={user.image}
							className="size-8"
						/>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 truncate">
								{user.name}
							</p>
							<p className="text-xs text-gray-500 truncate">
								{user.email}
							</p>
						</div>
						<button
							onClick={onLogout}
							className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
							title="Log out"
						>
							<LogOut className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</aside>
	);
}

