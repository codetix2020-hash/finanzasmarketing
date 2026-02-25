"use client";

import { useState } from "react";

export function PricingSection() {
	const [billing, setBilling] = useState<"monthly" | "annual">("annual");

	const plans = [
		{
			id: "pro",
			name: "PRO",
			description: "For solo brands & freelancers",
			price: { monthly: 39, annual: 29 },
			features: [
				"60 AI-generated posts/month",
				"1 brand",
				"Instagram + Facebook + TikTok",
				"Auto-scheduling & publishing",
				"Visual content calendar",
				"AI brand voice learning",
				"Performance analytics",
				"Email support",
			],
			popular: true,
		},
		{
			id: "agency",
			name: "AGENCY",
			description: "For agencies & teams",
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
		<section id="pricing" className="py-24">
			<div className="container">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="text-3xl font-bold text-white md:text-4xl">
						Simple, transparent pricing
					</h2>
					<p className="mt-4 text-zinc-400">
						Start free. Upgrade when you&apos;re ready.
					</p>
				</div>

				<div className="mt-8 flex items-center justify-center gap-3">
					<span
						className={
							billing === "monthly" ? "font-medium text-white" : "text-zinc-500"
						}
					>
						Monthly
					</span>
					<button
						type="button"
						onClick={() =>
							setBilling((current) =>
								current === "monthly" ? "annual" : "monthly",
							)
						}
						className={`relative h-7 w-14 rounded-full transition-colors ${
							billing === "annual" ? "bg-purple-500" : "bg-zinc-700"
						}`}
						aria-label="Toggle billing period"
					>
						<span
							className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${
								billing === "annual" ? "translate-x-7" : ""
							}`}
						/>
					</button>
					<span
						className={
							billing === "annual" ? "font-medium text-white" : "text-zinc-500"
						}
					>
						Annual
					</span>
					<span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
						Save 25%
					</span>
				</div>

				<div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2">
					{plans.map((plan) => (
						<div
							key={plan.id}
							className={`flex flex-col rounded-2xl border p-8 ${
								plan.popular
									? "border-purple-500/50 bg-zinc-900/80 shadow-lg shadow-purple-500/5"
									: "border-zinc-800 bg-zinc-900/40"
							}`}
						>
							{plan.popular && (
								<div className="mb-6 inline-flex w-fit rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white">
									MOST POPULAR
								</div>
							)}
							<h3 className="text-2xl font-bold text-white">{plan.name}</h3>
							<p className="mt-2 text-zinc-400">{plan.description}</p>

							<div className="mt-6 flex items-end gap-2">
								<span className="text-4xl font-bold text-white">
									€{plan.price[billing]}
								</span>
								<span className="pb-1 text-zinc-500">/month</span>
							</div>

							<ul className="mt-6 flex-1 space-y-3">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-start gap-2 text-zinc-300">
										<span className="text-emerald-400">✓</span>
										<span>{feature}</span>
									</li>
								))}
							</ul>

							<a
								href="/auth/signup"
								className={`mt-8 block rounded-xl px-5 py-3 text-center font-semibold transition ${
									plan.popular
										? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
										: "border border-zinc-700 text-white hover:border-zinc-500 hover:bg-zinc-800/50"
								}`}
							>
								Start 14-day free trial →
							</a>

							<p className="mt-3 text-center text-xs text-zinc-500">
								€0 today · Billed after trial
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
