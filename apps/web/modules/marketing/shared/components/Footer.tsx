import Link from "next/link";

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
					<Link href="/en/legal/privacy-policy" className="hover:text-white">
						Privacy
					</Link>
					<Link href="/en/legal/terms" className="hover:text-white">
						Terms
					</Link>
					<a href="#" className="hover:text-white">
						Contact
					</a>
				</div>
			</div>
		</footer>
	);
}
