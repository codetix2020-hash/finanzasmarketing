"use client";

import { useState } from "react";

export default function ChoosePlanPage() {
	const [billing, setBilling] = useState<"monthly" | "annual">("annual");
	const [loading, setLoading] = useState<string | null>(null);

	async function handleCheckout(plan: string) {
		setLoading(plan);
		try {
			const res = await fetch("/api/billing/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ plan, billing }),
			});
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			} else {
				console.error("Checkout error:", data);
				alert("Something went wrong. Please try again.");
			}
		} catch (error) {
			console.error("Checkout error:", error);
			alert("Something went wrong. Please try again.");
		} finally {
			setLoading(null);
		}
	}

	const plans = [
		{
			id: "pro",
			name: "Pro",
			description: "For solo brands & freelancers",
			price: { monthly: 39, annual: 29 },
			features: [
				"60 AI-generated posts/month",
				"1 brand",
				"Instagram + Facebook",
				"Auto-scheduling & auto-publish",
				"Visual content calendar",
				"Smart photo library",
				"AI content generator",
				"AI marketing assistant",
				"Performance analytics",
				"Email support",
			],
			popular: true,
		},
		{
			id: "agency",
			name: "Agency",
			description: "For teams & agencies managing multiple brands",
			price: { monthly: 99, annual: 79 },
			features: [
				"Unlimited posts",
				"5 brands",
				"Everything in Pro",
				"3 team members",
				"Priority support",
				"Advanced analytics",
				"Competitor monitoring (coming soon)",
			],
			popular: false,
		},
	];

	return (
		<div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
			<div className="text-center mb-10 max-w-2xl">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-xs font-medium mb-6">
					✦ 14-day free trial — no charge today
				</div>
				<h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
					Choose your plan
				</h1>
				<p className="text-zinc-400 text-lg">
					Start your 14-day free trial. Cancel anytime before it ends — you won&apos;t be charged.
				</p>
			</div>

			<div className="flex items-center gap-3 mb-10">
				<span className={`text-sm font-medium ${billing === "monthly" ? "text-white" : "text-zinc-500"}`}>
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
						className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
							billing === "annual" ? "translate-x-6" : ""
						}`}
					/>
				</button>
				<span className={`text-sm font-medium ${billing === "annual" ? "text-white" : "text-zinc-500"}`}>
					Annual
				</span>
				{billing === "annual" && (
					<span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
						Save 25%
					</span>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
				{plans.map((plan) => (
					<div
						key={plan.id}
						className={`relative rounded-2xl p-8 border transition-all duration-300 ${
							plan.popular
								? "border-purple-500/50 bg-zinc-900/80 shadow-lg shadow-purple-500/5"
								: "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
						}`}
					>
						{plan.popular && (
							<div className="absolute -top-3 left-1/2 -translate-x-1/2">
								<span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold">
									MOST POPULAR
								</span>
							</div>
						)}

						<div className="mb-6">
							<h2 className="text-2xl font-bold text-white">{plan.name}</h2>
							<p className="text-zinc-500 text-sm mt-1">{plan.description}</p>
						</div>

						<div className="mb-6">
							<div className="flex items-baseline gap-1">
								<span className="text-4xl font-bold text-white">€{plan.price[billing]}</span>
								<span className="text-zinc-500">/month</span>
							</div>
							{billing === "annual" && plan.price.monthly !== plan.price.annual && (
								<div className="flex items-center gap-2 mt-1">
									<span className="text-sm text-zinc-600 line-through">€{plan.price.monthly}/mo</span>
									<span className="text-xs text-emerald-400">Save €{(plan.price.monthly - plan.price.annual) * 12}/year</span>
								</div>
							)}
							<p className="text-xs text-zinc-500 mt-2">
								€0 today · Billed after 14-day trial
							</p>
						</div>

						<ul className="space-y-3 mb-8">
							{plan.features.map((feature) => (
								<li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-300">
									<svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
									</svg>
									{feature}
								</li>
							))}
						</ul>

						<button
							type="button"
							onClick={() => handleCheckout(plan.id)}
							disabled={loading !== null}
							className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
								plan.popular
									? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/20"
									: "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
							} ${loading === plan.id ? "opacity-50 cursor-wait" : ""} ${loading && loading !== plan.id ? "opacity-30 cursor-not-allowed" : ""}`}
						>
							{loading === plan.id ? (
								<span className="flex items-center justify-center gap-2">
									<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									Redirecting to checkout...
								</span>
							) : (
								"Start 14-day free trial →"
							)}
						</button>
					</div>
				))}
			</div>

			<div className="mt-10 text-center space-y-2">
				<div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
					<span className="flex items-center gap-1">
						<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						Secure payment via Stripe
					</span>
					<span>·</span>
					<span>Cancel anytime</span>
					<span>·</span>
					<span>No charge for 14 days</span>
				</div>
				<p className="text-xs text-zinc-700">
					By subscribing you agree to our Terms of Service and Privacy Policy
				</p>
			</div>
		</div>
	);
}
