"use client";

import { LocaleLink, useLocalePathname } from "@i18n/routing";
import { Button } from "@ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@ui/components/sheet";
import { cn } from "@ui/lib";
import { MenuIcon } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

export function NavBar() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const localePathname = useLocalePathname();
	const [isTop, setIsTop] = useState(true);

	const handleMobileMenuClose = () => {
		setMobileMenuOpen(false);
	};

	const debouncedScrollHandler = useDebounceCallback(
		() => {
			setIsTop(window.scrollY <= 10);
		},
		150,
		{
			maxWait: 150,
		},
	);

	useEffect(() => {
		window.addEventListener("scroll", debouncedScrollHandler);
		debouncedScrollHandler();
		return () => {
			window.removeEventListener("scroll", debouncedScrollHandler);
		};
	}, [debouncedScrollHandler]);

	useEffect(() => {
		handleMobileMenuClose();
	}, [localePathname]);

	const isDocsPage = localePathname.startsWith("/docs");

	const menuItems: {
		label: string;
		href: string;
		isAuth?: boolean;
	}[] = [
		{
			label: "Features",
			href: "/#features",
		},
		{
			label: "Pricing",
			href: "/#pricing",
		},
		{
			label: "Login",
			href: "/auth/login",
			isAuth: true,
		},
	];

	const isMenuItemActive = (href: string) => localePathname.startsWith(href);

	return (
		<nav
			className={cn(
				"fixed top-0 left-0 z-50 w-full border-zinc-800/50 border-b backdrop-blur-xl transition-shadow duration-200",
				!isTop || isDocsPage ? "bg-zinc-950/90 shadow-lg shadow-black/30" : "bg-zinc-950/80",
			)}
			data-test="navigation"
		>
			<div className="container">
				<div
					className={cn(
						"flex items-center justify-stretch gap-6 transition-[padding] duration-200",
						!isTop || isDocsPage ? "py-4" : "py-5",
					)}
				>
					<div className="flex flex-1 justify-start">
						<LocaleLink
							href="/"
							className="block hover:no-underline active:no-underline"
						>
							<span className="font-semibold text-white text-xl">✦ PilotSocials</span>
						</LocaleLink>
					</div>

					<div className="hidden flex-1 items-center justify-center lg:flex">
						{menuItems.map((menuItem) => (
							menuItem.isAuth ? (
								<NextLink
									key={menuItem.href}
									href={menuItem.href}
									className={cn(
										"block px-3 py-2 font-medium text-sm text-zinc-400 hover:text-white",
										isMenuItemActive(menuItem.href) ? "text-white" : "",
									)}
									prefetch
								>
									{menuItem.label}
								</NextLink>
							) : (
								<LocaleLink
									key={menuItem.href}
									href={menuItem.href}
									className={cn(
										"block px-3 py-2 font-medium text-sm text-zinc-400 hover:text-white",
										isMenuItemActive(menuItem.href) ? "text-white" : "",
									)}
									prefetch
								>
									{menuItem.label}
								</LocaleLink>
							)
						))}
					</div>

					<div className="flex flex-1 items-center justify-end gap-3">
						<Sheet
							open={mobileMenuOpen}
							onOpenChange={(open) => setMobileMenuOpen(open)}
						>
							<SheetTrigger asChild>
								<Button
									className="lg:hidden"
									size="icon"
									variant="ghost"
									aria-label="Menu"
								>
									<MenuIcon className="size-4 text-white" />
								</Button>
							</SheetTrigger>
							<SheetContent className="w-[280px] border-zinc-800 bg-zinc-950 text-white" side="right">
								<SheetTitle />
								<div className="flex flex-col items-start justify-center">
									{menuItems.map((menuItem) => (
										menuItem.isAuth ? (
											<NextLink
												key={menuItem.href}
												href={menuItem.href}
												onClick={handleMobileMenuClose}
												className={cn(
													"block px-3 py-2 font-medium text-base text-zinc-300 hover:text-white",
													isMenuItemActive(menuItem.href) ? "text-white" : "",
												)}
												prefetch
											>
												{menuItem.label}
											</NextLink>
										) : (
											<LocaleLink
												key={menuItem.href}
												href={menuItem.href}
												onClick={handleMobileMenuClose}
												className={cn(
													"block px-3 py-2 font-medium text-base text-zinc-300 hover:text-white",
													isMenuItemActive(menuItem.href) ? "text-white" : "",
												)}
												prefetch
											>
												{menuItem.label}
											</LocaleLink>
										)
									))}

									<NextLink
										href="/auth/signup"
										className="mt-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white"
										onClick={handleMobileMenuClose}
									>
										Start free trial →
									</NextLink>
								</div>
							</SheetContent>
						</Sheet>

						<Button
							className="hidden border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white lg:flex"
							asChild
						>
							<NextLink href="/auth/signup">Start free trial →</NextLink>
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
}
