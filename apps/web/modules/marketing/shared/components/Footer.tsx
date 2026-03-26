import { LocaleLink } from "@i18n/routing";

export function Footer() {
	return (
		<footer className="border-zinc-800 border-t bg-zinc-950 py-10 text-sm text-zinc-500">
			<div className="container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="font-semibold text-white text-xl">✦ PilotSocials</p>
					<p className="mt-2">© 2026 PilotSocials. All rights reserved.</p>
					<p className="mt-1">Made with ❤️ in Barcelona</p>
				</div>

				<div className="flex items-center gap-5 text-zinc-400">
					<LocaleLink href="/legal/privacy-policy" className="hover:text-white">
						Privacy
					</LocaleLink>
					<LocaleLink href="/legal/terms" className="hover:text-white">
						Terms
					</LocaleLink>
					<a href="mailto:hello@pilotsocials.com" className="hover:text-white">
						Contact
					</a>
				</div>
			</div>
		</footer>
	);
}
