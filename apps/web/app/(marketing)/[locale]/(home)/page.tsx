import { PricingSection } from "./PricingSection";

const withoutPilotSocials = [
	"Spending 2+ hours daily creating content",
	"Inconsistent posting schedule",
	"Generic AI content that doesn't match your brand",
	"Managing 4+ different social media tools",
	"No time left for actual business growth",
	"Paying €500+/month for a social media manager",
];

const withPilotSocials = [
	"AI creates branded content in seconds",
	"Automatic scheduling and publishing 24/7",
	"Content that matches YOUR brand voice perfectly",
	"One platform for Instagram, Facebook & TikTok",
	"Focus on your business while AI handles social",
	"Starting at €29/month — save thousands per year",
];

const features = [
	{
		icon: "🤖",
		title: "AI Content Generator",
		description:
			"Creates posts, captions, and stories that match your brand voice perfectly.",
	},
	{
		icon: "📅",
		title: "Smart Scheduler",
		description:
			"Automatically schedules content at the optimal time for maximum engagement.",
	},
	{
		icon: "⚡",
		title: "Auto-Publishing",
		description:
			"Posts go live automatically on Instagram, Facebook, and TikTok.",
	},
	{
		icon: "🎯",
		title: "Brand Voice AI",
		description:
			"Learns your unique tone and style. Every post sounds authentically you.",
	},
	{
		icon: "📊",
		title: "Visual Content Calendar",
		description:
			"See your entire content plan at a glance. Drag, drop, and reorder.",
	},
	{
		icon: "📈",
		title: "Performance Analytics",
		description:
			"Track engagement, growth, and ROI across all your social platforms.",
	},
];

const comparisonRows = [
	{
		feature: "AI content creation",
		pilotSocials: "✓",
		cm: "✗",
		tools: "✗",
		chatgpt: "✓",
	},
	{
		feature: "Auto-publishing",
		pilotSocials: "✓",
		cm: "✓",
		tools: "✓",
		chatgpt: "✗",
	},
	{
		feature: "Brand voice learning",
		pilotSocials: "✓",
		cm: "✓",
		tools: "✗",
		chatgpt: "✗",
	},
	{
		feature: "Multi-platform",
		pilotSocials: "✓",
		cm: "✓",
		tools: "✓",
		chatgpt: "✗",
	},
	{
		feature: "24/7 automated",
		pilotSocials: "✓",
		cm: "✗",
		tools: "Partial",
		chatgpt: "✗",
	},
	{
		feature: "Cost/month",
		pilotSocials: "From €29",
		cm: "€500+",
		tools: "€50+",
		chatgpt: "€20+",
	},
];

const testimonials = [
	{
		quote:
			"PilotSocials saved us 15 hours a week. The AI actually sounds like our brand — our followers can't tell the difference.",
		author: "Sarah M., Founder @ GlowUp Skincare",
	},
	{
		quote:
			"We went from posting twice a week to daily — and our engagement tripled. Best investment we've made this year.",
		author: "Marco R., Marketing Lead @ FitNation",
	},
	{
		quote:
			"As a freelancer managing 5 clients, PilotSocials is a game-changer. I literally 3x'd my capacity without hiring anyone.",
		author: "Lisa K., Social Media Freelancer",
	},
];

export default function HomePage() {
	return (
		<div className="bg-zinc-950 pt-24 text-white">
			<section className="py-20 md:py-24">
				<div className="container">
					<div className="mx-auto max-w-4xl text-center">
						<div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
							✦ AI-Powered Social Media Autopilot
						</div>
						<h1 className="mt-8 text-balance text-5xl font-bold md:text-7xl">
							Your Social Media on{" "}
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								Autopilot
							</span>
						</h1>
						<p className="mx-auto mt-6 max-w-3xl text-xl text-zinc-400">
							PilotSocials creates, schedules, and publishes content for your
							brand — automatically. Stop spending hours on social media. Let AI
							do it.
						</p>
						<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
							<a
								href="/auth/signup"
								className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-base font-semibold text-white transition hover:opacity-90"
							>
								Start 14-day free trial →
							</a>
							<a
								href="#how-it-works"
								className="rounded-xl border border-zinc-700 px-8 py-4 text-base font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
							>
								See how it works ↓
							</a>
						</div>
						<p className="mt-6 text-sm text-zinc-500">
							✓ 14-day free trial · ✓ Cancel anytime · ✓ Setup in 2 minutes
						</p>
					</div>
				</div>
			</section>

			<section className="border-y border-zinc-800 bg-zinc-900/50 py-10">
				<div className="container">
					<p className="text-center text-zinc-500">
						Trusted by 200+ brands and agencies worldwide
					</p>
					<div className="mt-8 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
						<div>
							<p className="text-3xl font-bold text-white">200+</p>
							<p className="mt-1 text-xs text-zinc-500">Brands</p>
						</div>
						<div>
							<p className="text-3xl font-bold text-white">50K+</p>
							<p className="mt-1 text-xs text-zinc-500">Posts generated</p>
						</div>
						<div>
							<p className="text-3xl font-bold text-white">4.9/5</p>
							<p className="mt-1 text-xs text-zinc-500">Rating</p>
						</div>
						<div>
							<p className="text-3xl font-bold text-white">15min</p>
							<p className="mt-1 text-xs text-zinc-500">Setup</p>
						</div>
					</div>
				</div>
			</section>

			<section id="features" className="py-24">
				<div className="container">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="text-3xl font-bold md:text-4xl">
							Stop wasting time. Start growing.
						</h2>
					</div>
					<div className="mt-12 grid gap-6 lg:grid-cols-2">
						<div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
							<h3 className="text-2xl font-semibold text-white">
								Without PilotSocials
							</h3>
							<ul className="mt-6 space-y-3">
								{withoutPilotSocials.map((item) => (
									<li key={item} className="flex items-start gap-2 text-zinc-300">
										<span className="text-red-400">✗</span>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
							<h3 className="text-2xl font-semibold text-white">
								With PilotSocials
							</h3>
							<ul className="mt-6 space-y-3">
								{withPilotSocials.map((item) => (
									<li key={item} className="flex items-start gap-2 text-zinc-200">
										<span className="text-emerald-400">✓</span>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			<section id="how-it-works" className="py-24">
				<div className="container">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
						<p className="mt-4 text-zinc-400">Set up in minutes, not days</p>
					</div>

					<div className="mt-12 grid gap-6 lg:grid-cols-3">
						<div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
							<p className="text-6xl font-bold text-purple-500/20">01</p>
							<p className="mt-4 text-3xl">🔗</p>
							<h3 className="mt-4 text-xl font-semibold text-white">
								Connect your brand
							</h3>
							<p className="mt-3 text-zinc-400">
								Link your Instagram, Facebook, or TikTok account. Tell the AI
								about your brand, tone, and audience.
							</p>
						</div>
						<div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
							<p className="text-6xl font-bold text-purple-500/20">02</p>
							<p className="mt-4 text-3xl">✨</p>
							<h3 className="mt-4 text-xl font-semibold text-white">
								AI creates content
							</h3>
							<p className="mt-3 text-zinc-400">
								Our AI analyzes your brand and generates posts, captions, and
								hashtags tailored to your audience.
							</p>
						</div>
						<div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
							<p className="text-6xl font-bold text-purple-500/20">03</p>
							<p className="mt-4 text-3xl">🚀</p>
							<h3 className="mt-4 text-xl font-semibold text-white">
								Auto-publish & grow
							</h3>
							<p className="mt-3 text-zinc-400">
								Content is automatically scheduled and published at optimal times.
								Watch your engagement grow.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="py-24">
				<div className="container">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="text-3xl font-bold md:text-4xl">
							Everything you need to dominate social media
						</h2>
						<p className="mt-4 text-zinc-400">
							One platform. Zero effort. Maximum results.
						</p>
					</div>

					<div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<div
								key={feature.title}
								className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"
							>
								<p className="text-3xl">{feature.icon}</p>
								<h3 className="mt-4 text-xl font-semibold text-white">
									{feature.title}
								</h3>
								<p className="mt-2 text-zinc-400">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="py-24">
				<div className="container">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="text-3xl font-bold md:text-4xl">Why PilotSocials?</h2>
						<p className="mt-4 text-zinc-400">See how we compare</p>
					</div>

					<div className="mt-12 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/30">
						<table className="min-w-full text-left text-sm">
							<thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-300">
								<tr>
									<th className="px-5 py-4">Feature</th>
									<th className="border-x border-purple-500/30 bg-purple-500/10 px-5 py-4 text-center text-white">
										PilotSocials
									</th>
									<th className="px-5 py-4 text-center">Hiring a CM</th>
									<th className="px-5 py-4 text-center">Buffer/Hootsuite</th>
									<th className="px-5 py-4 text-center">ChatGPT</th>
								</tr>
							</thead>
							<tbody className="text-zinc-300">
								{comparisonRows.map((row) => (
									<tr key={row.feature} className="border-b border-zinc-800/80">
										<td className="px-5 py-4 font-medium text-zinc-200">
											{row.feature}
										</td>
										<td className="border-x border-purple-500/30 bg-purple-500/10 px-5 py-4 text-center font-medium text-white">
											<span
												className={
													row.pilotSocials === "✓"
														? "text-emerald-400"
														: row.pilotSocials === "✗"
															? "text-red-400"
															: "text-white"
												}
											>
												{row.pilotSocials}
											</span>
										</td>
										<td className="px-5 py-4 text-center">
											<span
												className={
													row.cm === "✓"
														? "text-emerald-400"
														: row.cm === "✗"
															? "text-red-400"
															: "text-zinc-300"
												}
											>
												{row.cm}
											</span>
										</td>
										<td className="px-5 py-4 text-center">
											<span
												className={
													row.tools === "✓"
														? "text-emerald-400"
														: row.tools === "✗"
															? "text-red-400"
															: "text-zinc-300"
												}
											>
												{row.tools}
											</span>
										</td>
										<td className="px-5 py-4 text-center">
											<span
												className={
													row.chatgpt === "✓"
														? "text-emerald-400"
														: row.chatgpt === "✗"
															? "text-red-400"
															: "text-zinc-300"
												}
											>
												{row.chatgpt}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<section className="py-24">
				<div className="container">
					<div className="mx-auto max-w-3xl text-center">
						<h2 className="text-3xl font-bold md:text-4xl">
							Loved by brands worldwide
						</h2>
					</div>
					<div className="mt-12 grid gap-6 lg:grid-cols-3">
						{testimonials.map((item) => (
							<div
								key={item.author}
								className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8"
							>
								<p className="text-yellow-400">⭐⭐⭐⭐⭐</p>
								<p className="mt-4 text-zinc-300">{item.quote}</p>
								<p className="mt-6 font-medium text-zinc-100">— {item.author}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<PricingSection />

			<section className="py-24">
				<div className="container">
					<div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-12 md:p-16">
						<div className="mx-auto max-w-3xl text-center">
							<h2 className="text-3xl font-bold md:text-4xl">
								Ready to put your social media on autopilot?
							</h2>
							<p className="mt-4 text-zinc-400">
								Join 200+ brands already saving 15+ hours per week
							</p>
							<a
								href="/auth/signup"
								className="mt-8 inline-block rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-base font-semibold text-white transition hover:opacity-90"
							>
								Start your free trial →
							</a>
							<p className="mt-4 text-sm text-zinc-500">
								14-day free trial · No risk · Cancel anytime
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
