"use client";

import { useState } from "react";

const plans = [
	{
		name: "Pro",
		price: { monthly: 29, annual: 29 },
		description: "For solo brands",
		features: [
			"60 posts/month",
			"1 brand",
			"Instagram + Facebook",
			"Auto-scheduling & auto-publish",
			"Visual calendar",
			"Photo library",
			"AI content generator",
			"Email support",
		],
		popular: true,
	},
	{
		name: "Agency",
		price: { monthly: 79, annual: 79 },
		description: "For teams & agencies",
		features: [
			"Unlimited posts",
			"5 brands",
			"Everything in Pro",
			"Priority support",
			"Analytics dashboard",
			"3 team members",
		],
		popular: false,
	},
];

export default function UpgradePage() {
	const [billing, setBilling] = useState<"monthly" | "annual">("annual");
	const [loading, setLoading] = useState<string | null>(null);

	async function handleCheckout(plan: string) {
		setLoading(plan);
		try {
			const res = await fetch("/api/billing/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ plan: plan.toLowerCase(), billing }),
			});

			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
				return;
			}

			alert(data.error || "Error creating checkout session");
		} catch (error) {
			alert(`Error: ${String(error)}`);
		} finally {
			setLoading(null);
		}
	}

	return (
		<div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
			<div className="max-w-3xl mx-auto text-center mb-12">
				<h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
					Your free trial has ended
				</h1>
				<p className="text-zinc-400 text-lg">
					Choose a plan to keep your content engine running on autopilot.
				</p>
			</div>

			<div className="flex items-center gap-3 mb-10">
				<span className={`text-sm ${billing === "monthly" ? "text-white" : "text-zinc-500"}`}>
					Monthly
				</span>
				<button
					type="button"
					onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")}
					className={`relative w-12 h-6 rounded-full transition-colors ${
						billing === "annual" ? "bg-purple-500" : "bg-zinc-700"
					}`}
				>
					<div
						className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
							billing === "annual" ? "translate-x-6" : ""
						}`}
					/>
				</button>
				<span className={`text-sm ${billing === "annual" ? "text-white" : "text-zinc-500"}`}>
					Annual
					<span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs">
						Save 25%
					</span>
				</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
				{plans.map((plan) => (
					<div
						key={plan.name}
						className={`rounded-xl p-6 border ${
							plan.popular
								? "border-purple-500/50 bg-zinc-900/80"
								: "border-zinc-800 bg-zinc-900/50"
						} flex flex-col`}
					>
						{plan.popular && (
							<div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-medium w-fit mb-4">
								MOST POPULAR
							</div>
						)}
						<h2 className="text-xl font-bold text-white">{plan.name}</h2>
						<p className="text-zinc-500 text-sm mt-1">{plan.description}</p>
						<div className="mt-4 mb-6">
							<span className="text-4xl font-bold text-white">
								€{plan.price[billing]}
							</span>
							<span className="text-zinc-500">/mo</span>
						</div>
						<ul className="space-y-2 flex-1">
							{plan.features.map((feature) => (
								<li key={feature} className="flex items-start gap-2 text-sm text-zinc-400">
									<span className="text-emerald-400 mt-0.5">✓</span>
									{feature}
								</li>
							))}
						</ul>
						<button
							type="button"
							onClick={() => handleCheckout(plan.name)}
							disabled={loading !== null}
							className={`mt-6 w-full py-3 rounded-lg font-medium text-sm transition-all ${
								plan.popular
									? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
									: "border border-zinc-700 text-white hover:bg-zinc-800"
							} ${loading === plan.name ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							{loading === plan.name ? "Redirecting to Stripe..." : `Choose ${plan.name}`}
						</button>
					</div>
				))}
			</div>

			<p className="text-zinc-600 text-sm mt-8">
				Secure payment via Stripe. Cancel anytime.
			</p>
		</div>
	);
}
