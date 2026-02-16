"use client";
import { config } from "@repo/config";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useOrganizationListQuery } from "@saas/organizations/lib/api";
import { ActivePlanBadge } from "@saas/payments/components/ActivePlanBadge";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { OrganizationLogo } from "./OrganizationLogo";

export function OrganzationSelect({ className }: { className?: string }) {
	const t = useTranslations();
	const { user } = useSession();
	const router = useRouter();
	const { activeOrganization, setActiveOrganization } =
		useActiveOrganization();
	const { data: allOrganizations } = useOrganizationListQuery();

	if (!user) {
		return null;
	}

	// Si solo hay una organización, mostrar solo el nombre sin dropdown
	if (allOrganizations?.length === 1 && activeOrganization) {
		return (
			<div className={className}>
				<div className="flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm">
					<OrganizationLogo
						name={activeOrganization.name}
						logoUrl={activeOrganization.logo}
						className="size-6"
					/>
					<span className="block flex-1 truncate font-medium">
						{activeOrganization.name}
					</span>
					{config.organizations.enableBilling && (
						<ActivePlanBadge
							organizationId={activeOrganization.id}
						/>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={className}>
			<DropdownMenu>
				<DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-md border p-2 text-left outline-none focus-visible:bg-primary/10 focus-visible:ring-none">
					<div className="flex flex-1 items-center justify-start gap-2 text-sm overflow-hidden">
						{activeOrganization ? (
							<>
								<OrganizationLogo
									name={activeOrganization.name}
									logoUrl={activeOrganization.logo}
									className="hidden size-6 sm:block"
								/>
								<span className="block flex-1 truncate">
									{activeOrganization.name}
								</span>
								{config.organizations.enableBilling && (
									<ActivePlanBadge
										organizationId={activeOrganization.id}
									/>
								)}
							</>
						) : (
							<span className="block truncate text-foreground/60">
								Selecciona una marca
							</span>
						)}
					</div>

					<ChevronsUpDownIcon className="block size-4 opacity-50" />
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-full">
					{/* Solo organizaciones - sin "Personal Account" */}
					<DropdownMenuRadioGroup
						value={activeOrganization?.slug}
						onValueChange={async (organizationSlug: string) => {
							await clearCache();
							setActiveOrganization(organizationSlug);
						}}
					>
						<DropdownMenuLabel className="text-foreground/60 text-xs">
							Tus marcas
						</DropdownMenuLabel>
						{allOrganizations?.map((organization) => (
							<DropdownMenuRadioItem
								key={organization.slug}
								value={organization.slug}
								className="flex cursor-pointer items-center justify-center gap-2 pl-3"
							>
								<div className="flex flex-1 items-center justify-start gap-2">
									<OrganizationLogo
										className="size-8"
										name={organization.name}
										logoUrl={organization.logo}
									/>
									{organization.name}
								</div>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>

					{config.organizations.enableUsersToCreateOrganizations && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem
									asChild
									className="text-primary! cursor-pointer text-sm"
								>
									<Link href="/new-organization">
										<PlusIcon className="mr-2 size-6 rounded-md bg-primary/20 p-1" />
										Crear nueva marca
									</Link>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
