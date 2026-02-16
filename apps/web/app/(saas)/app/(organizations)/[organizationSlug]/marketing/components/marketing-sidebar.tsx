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
	Wand2,
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
					? "bg-primary/10 text-primary font-medium"
					: "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
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
			<span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
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
		<aside className="w-64 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed left-0 top-0 z-40">
			{/* Logo MarketingOS */}
			<div className="p-4 border-b border-gray-100 dark:border-gray-800">
				<Link href={`${basePath}/dashboard`} className="flex items-center gap-2.5">
					<div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/20">
						<Wand2 className="h-5 w-5 text-white" />
					</div>
					<span className="font-bold text-lg text-gray-900 dark:text-white">
						MarketingOS
					</span>
				</Link>
			</div>

			{/* Selector de organización */}
			<div className="p-3 border-b border-gray-100 dark:border-gray-800">
				<div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
					<OrganizationLogo
						name={orgName}
						logoUrl={orgLogo}
						className="size-8"
					/>
					<span className="font-medium text-sm text-gray-900 dark:text-white truncate">
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
					label="Automatización"
					isActive={isActive("automation")}
				/>
				<NavItem
					href={`${basePath}/assistant`}
					icon={Bot}
					label="Asistente AI"
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
					label="Generar contenido"
					isActive={isActive("generate")}
				/>

				<SectionLabel>Contenido</SectionLabel>

				<NavItem
					href={`${basePath}/content`}
					icon={FileText}
					label="Contenido"
					isActive={isActive("content") && !isActive("content/calendar") && !isActive("content/create")}
				/>
				<NavItem
					href={`${basePath}/content/create`}
					icon={Wand2}
					label="Crear contenido"
					isActive={isActive("content/create")}
				/>
				<NavItem
					href={`${basePath}/content/calendar`}
					icon={Calendar}
					label="Calendario"
					isActive={isActive("content/calendar")}
				/>
				<NavItem
					href={`${basePath}/published`}
					icon={Send}
					label="Publicados"
					isActive={isActive("published")}
				/>
				<NavItem
					href={`${basePath}/media`}
					icon={ImageIcon}
					label="Banco de Fotos"
					isActive={isActive("media")}
				/>
				<NavItem
					href={`${basePath}/brand-photos`}
					icon={Camera}
					label="Fotos de Marca"
					isActive={isActive("brand-photos")}
				/>

				<SectionLabel>Análisis</SectionLabel>

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
			<div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
				<NavItem
					href={`${basePath}/profile`}
					icon={Building2}
					label="Perfil empresa"
					isActive={isActive("profile")}
				/>
				<NavItem
					href={`/app/${organizationSlug}/settings/integrations`}
					icon={Plug}
					label="Integraciones"
					isActive={pathname.includes("/settings/integrations")}
				/>
				<NavItem
					href={`/app/${organizationSlug}/settings/billing`}
					icon={CreditCard}
					label="Facturación"
					isActive={pathname.includes("/settings/billing")}
				/>
			</div>

			{/* Usuario */}
			{user && (
				<div className="p-3 border-t border-gray-100 dark:border-gray-800">
					<div className="flex items-center gap-3 p-2">
						<UserAvatar
							name={user.name ?? ""}
							avatarUrl={user.image}
							className="size-8"
						/>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
								{user.name}
							</p>
							<p className="text-xs text-gray-500 truncate">
								{user.email}
							</p>
						</div>
						<button
							onClick={onLogout}
							className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							title="Cerrar sesión"
						>
							<LogOut className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</aside>
	);
}

