"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@ui/components/button";

interface MarketingErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function MarketingErrorPage({
	error,
	reset,
}: MarketingErrorPageProps) {
	useEffect(() => {
		console.error("Marketing route error:", error);
	}, [error]);

	return (
		<div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-950 via-purple-950/40 to-fuchsia-950/30" />

			<div className="relative mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-6">
				<div className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 p-8 text-center shadow-2xl backdrop-blur">
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200">
						<Sparkles className="h-4 w-4" />
						<span>PilotSocials</span>
					</div>

					<h1 className="text-3xl font-semibold tracking-tight">
						Something went wrong
					</h1>
					<p className="mx-auto mt-3 max-w-xl text-sm text-zinc-300">
						We hit an unexpected error. Try refreshing or go back to the dashboard.
					</p>

					<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
						<Button
							onClick={reset}
							className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
						>
							Try again
						</Button>
						<Button asChild variant="outline" className="border-white/20 bg-transparent">
							<Link href="/app">Go to dashboard</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
