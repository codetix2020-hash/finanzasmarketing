import Link from "next/link";

export default function BillingSuccessPage() {
	return (
		<div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
			<div className="max-w-md text-center">
				<div className="text-5xl mb-6">🎉</div>
				<h1 className="text-2xl font-bold text-white mb-3">
					Welcome to PilotSocials!
				</h1>
				<p className="text-zinc-400 mb-8">
					Your subscription is active. Let&apos;s start creating content that converts.
				</p>
				<Link
					href="/app"
					className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
				>
					Go to dashboard →
				</Link>
			</div>
		</div>
	);
}
