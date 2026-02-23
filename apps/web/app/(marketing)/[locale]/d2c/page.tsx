"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
	ArrowRight,
	Check,
	Sparkles,
	CalendarDays,
	ImageIcon,
	Rocket,
	BarChart3,
	MessageCircle,
	Bot,
	CheckCircle2,
	Instagram,
	ShoppingBag,
	Users,
	Building2,
} from "lucide-react";

/* ──────────────────────────────────────────── */
/*  Hide parent layout navbar, show our own     */
/* ──────────────────────────────────────────── */

function useHideParentNav() {
	useEffect(() => {
		const parentNav = document.querySelector(
			'nav[data-test="navigation"]',
		) as HTMLElement | null;
		if (parentNav) parentNav.style.display = "none";
		return () => {
			if (parentNav) parentNav.style.display = "";
		};
	}, []);
}

/* ──────────────────────────────────────────── */
/*  D2C Navbar                                  */
/* ──────────────────────────────────────────── */

function D2CNavbar() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<nav
			className={`fixed top-0 left-0 z-50 w-full transition-all duration-200 ${
				scrolled
					? "bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800 shadow-sm"
					: ""
			}`}
		>
			<div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
				<Link href="/" className="text-lg font-bold text-white tracking-tight">
					MarketingOS
				</Link>

				<div className="hidden md:flex items-center gap-8">
					<a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
						Features
					</a>
					<a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
						Pricing
					</a>
					<a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">
						FAQ
					</a>
				</div>

				<Link
					href="/auth/signup"
					className="text-sm font-semibold px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all duration-200"
				>
					Start free trial
				</Link>
			</div>
		</nav>
	);
}

/* ──────────────────────────────────────────── */
/*  FAQ Accordion                               */
/* ──────────────────────────────────────────── */

function FAQItem({ question, answer }: { question: string; answer: string }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="border-b border-zinc-800">
			<button
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between py-5 text-left text-white font-medium hover:text-purple-400 transition-colors"
			>
				{question}
				<span className={`text-xl transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
					+
				</span>
			</button>
			{open && <p className="pb-5 text-zinc-400 leading-relaxed">{answer}</p>}
		</div>
	);
}

/* ──────────────────────────────────────────── */
/*  Page                                        */
/* ──────────────────────────────────────────── */

export default function D2CLandingPage() {
	useHideParentNav();

	return (
		<div className="bg-zinc-950 text-white">
			<D2CNavbar />

			{/* ════════ SECTION 1: HERO ════════ */}
			<section className="relative pt-28 pb-32 px-6 overflow-hidden">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

				<div className="relative max-w-6xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-300 mb-8">
						<Sparkles className="h-4 w-4 text-purple-400" />
						AI-powered content engine
					</div>

					<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
						Your brand posts.
						<br />
						<span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
							While you sleep.
						</span>
					</h1>

					<p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
						AI that knows your brand voice. Creates scroll-stopping content.
						Publishes on autopilot to Instagram & Facebook.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
						<Link
							href="/auth/signup"
							className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40"
						>
							Start free trial
							<ArrowRight className="h-4 w-4" />
						</Link>
						<a
							href="#how-it-works"
							className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full border border-zinc-700 text-zinc-300 font-semibold hover:border-zinc-500 hover:text-white transition-all duration-200"
						>
							See how it works
						</a>
					</div>

					<p className="text-sm text-zinc-500">
						14-day free trial &nbsp;•&nbsp; No credit card required &nbsp;•&nbsp; Cancel anytime
					</p>

					{/* ── Product flow mockup ── */}
					<div className="mt-20 relative">
						<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 pointer-events-none" />
						<div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-sm">
							{/* Browser chrome */}
							<div className="flex items-center gap-3 mb-6">
								<div className="flex gap-1.5">
									<div className="w-3 h-3 rounded-full bg-zinc-700" />
									<div className="w-3 h-3 rounded-full bg-zinc-700" />
									<div className="w-3 h-3 rounded-full bg-zinc-700" />
								</div>
								<div className="flex-1 h-6 rounded-full bg-zinc-800 max-w-xs mx-auto" />
							</div>

							{/* 3 flow cards */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								{/* Card 1: Upload */}
								<div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-5 text-left">
									<div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider mb-3">
										<ImageIcon className="h-3.5 w-3.5 text-purple-400" />
										Upload
									</div>
									<div className="aspect-square rounded-lg bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-zinc-800 mb-3 flex items-center justify-center">
										<ImageIcon className="h-8 w-8 text-zinc-500" />
									</div>
									<p className="text-xs text-zinc-500">Drop your product photo</p>
								</div>

								{/* Card 2: Generate */}
								<div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-5 text-left">
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider">
											<Sparkles className="h-3.5 w-3.5 text-pink-400" />
											Generate
										</div>
										<span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
											AI Generated
										</span>
									</div>
									<p className="text-sm text-zinc-300 leading-relaxed mb-2">
										✨ Introducing our new summer collection — light fabrics, bold colors, made for the sun...
									</p>
									<div className="flex flex-wrap gap-1.5">
										{["#fashion", "#newdrop", "#summerstyle"].map((tag) => (
											<span key={tag} className="text-[11px] text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded">
												{tag}
											</span>
										))}
									</div>
								</div>

								{/* Card 3: Publish */}
								<div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-5 text-left">
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-2 text-zinc-500 text-xs font-medium uppercase tracking-wider">
											<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
											Publish
										</div>
										<span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
											Live
										</span>
									</div>
									<div className="rounded-lg bg-zinc-900/80 border border-zinc-700/30 p-3 mb-3">
										<div className="flex items-center gap-2 mb-2">
											<div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
											<span className="text-xs text-zinc-400 font-medium">yourbrand</span>
										</div>
										<div className="aspect-[4/3] rounded bg-gradient-to-br from-purple-600/20 to-pink-600/10 mb-2" />
										<p className="text-[11px] text-zinc-500 leading-relaxed truncate">
											✨ Introducing our new summer collection...
										</p>
									</div>
									<div className="flex items-center gap-2 text-zinc-500">
										<Instagram className="h-3.5 w-3.5" />
										<span className="text-xs">Published 2m ago</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ════════ SECTION 2: BUILT FOR ════════ */}
			<section className="py-20 px-6 border-t border-zinc-900">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
						Built for brands that move fast
					</h2>

					<div className="grid md:grid-cols-3 gap-5">
						{[
							{
								icon: ShoppingBag,
								title: "D2C Brands",
								desc: "Fashion, beauty, jewelry, skincare. If you sell online, we speak your language.",
							},
							{
								icon: Users,
								title: "Freelancers",
								desc: "Managing multiple clients? Generate content for all of them from one dashboard.",
							},
							{
								icon: Building2,
								title: "Small Agencies",
								desc: "Scale your content output without scaling your team.",
							},
						].map((item) => {
							const Icon = item.icon;
							return (
								<div
									key={item.title}
									className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition-all duration-300"
								>
									<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-4">
										<Icon className="h-5 w-5 text-purple-400" />
									</div>
									<h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
									<p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ════════ SECTION 3: FEATURES ════════ */}
			<section id="features" className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need</h2>
						<p className="text-zinc-400 text-lg">One platform. Zero busywork.</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
						{[
							{
								icon: Bot,
								title: "AI Content Generator",
								description:
									"Describe your brand once. Get weeks of on-brand posts, captions, and hashtags in seconds.",
							},
							{
								icon: CalendarDays,
								title: "Visual Calendar",
								description:
									"Drag, drop, and schedule. See your entire content pipeline at a glance.",
							},
							{
								icon: ImageIcon,
								title: "Smart Photo Library",
								description:
									"Upload once, use forever. AI tags and organizes your brand photos automatically.",
							},
							{
								icon: Rocket,
								title: "Auto-Publish",
								description:
									"Set it and forget it. Posts go live on Instagram & Facebook exactly when your audience is active.",
							},
							{
								icon: BarChart3,
								title: "Performance Analytics",
								description:
									"Track what works. See engagement, reach, and growth across all platforms.",
							},
							{
								icon: MessageCircle,
								title: "AI Assistant",
								description:
									"Your 24/7 marketing strategist. Ask anything about your content, audience, or next move.",
							},
						].map((feature) => {
							const Icon = feature.icon;
							return (
								<div
									key={feature.title}
									className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition-all duration-300"
								>
									<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all duration-300">
										<Icon className="h-5 w-5 text-purple-400" />
									</div>
									<h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
									<p className="text-zinc-400 leading-relaxed text-sm">{feature.description}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ════════ SECTION 4: HOW IT WORKS ════════ */}
			<section id="how-it-works" className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Up and running in 3 minutes</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-8 relative">
						<div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-purple-600/50" />

						{[
							{
								num: "1",
								title: "Tell us about your brand",
								desc: "Industry, tone, audience. Takes 60 seconds.",
							},
							{
								num: "2",
								title: "AI generates your content",
								desc: "Posts, captions, hashtags — all on-brand.",
							},
							{
								num: "3",
								title: "Review & publish",
								desc: "Edit if you want. Or let autopilot handle it.",
							},
						].map((step) => (
							<div key={step.num} className="relative text-center">
								<div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg shadow-purple-600/25">
									{step.num}
								</div>
								<h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
								<p className="text-zinc-400">{step.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ════════ SECTION 5: PRICING ════════ */}
			<section id="pricing" className="py-24 px-6">
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Simple pricing. No surprises.</h2>
						<p className="text-zinc-400 text-lg">
							Start with a 14-day free trial. Upgrade when you&apos;re ready.
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
						{/* PRO */}
						<div className="relative rounded-2xl border-2 border-purple-500/60 bg-zinc-900/60 p-8 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
							<div className="absolute -top-3 left-1/2 -translate-x-1/2">
								<span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-bold uppercase tracking-wider">
									Most Popular
								</span>
							</div>

							<h3 className="text-xl font-semibold mb-1">Pro</h3>
							<p className="text-zinc-500 text-sm mb-5">For solo brands</p>
							<div className="mb-6">
								<span className="text-5xl font-bold">€29</span>
								<span className="text-zinc-500">/mo</span>
							</div>

							<ul className="space-y-3 mb-8">
								{[
									"60 posts/month",
									"1 brand",
									"Instagram + Facebook",
									"Auto-scheduling",
									"Auto-publish",
									"Visual calendar",
									"Photo library",
									"Email support",
								].map((f) => (
									<li key={f} className="flex items-center gap-2.5 text-zinc-300 text-sm">
										<Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
										{f}
									</li>
								))}
							</ul>

							<Link
								href="/auth/signup"
								className="block w-full text-center py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20"
							>
								Start free trial →
							</Link>
						</div>

						{/* AGENCY */}
						<div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 hover:border-zinc-700 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
							<h3 className="text-xl font-semibold mb-1">Agency</h3>
							<p className="text-zinc-500 text-sm mb-5">For teams & agencies</p>
							<div className="mb-6">
								<span className="text-5xl font-bold">€79</span>
								<span className="text-zinc-500">/mo</span>
							</div>

							<ul className="space-y-3 mb-8">
								{[
									"Unlimited posts",
									"5 brands",
									"Everything in Pro",
									"Priority support",
									"Reports (coming soon)",
								].map((f) => (
									<li key={f} className="flex items-center gap-2.5 text-zinc-300 text-sm">
										<Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
										{f}
									</li>
								))}
							</ul>

							<Link
								href="/auth/signup"
								className="block w-full text-center py-3 rounded-full border border-zinc-700 text-zinc-300 font-semibold hover:border-zinc-500 hover:text-white transition-all duration-200"
							>
								Start free trial →
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ════════ SECTION 5.5: HOW MUCH YOU SAVE ════════ */}
			<section className="py-20 px-6">
				<div className="max-w-3xl mx-auto">
					<div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 px-8 py-14 text-center">
						<p className="text-xl md:text-2xl text-zinc-400 leading-relaxed mb-2">
							A community manager costs{" "}
							<span className="text-white font-semibold">€500–1,500/month</span>.
						</p>
						<p className="text-xl md:text-2xl text-zinc-400 leading-relaxed mb-2">
							ChatGPT doesn&apos;t know your brand.
						</p>
						<p className="text-xl md:text-2xl leading-relaxed">
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">
								MarketingOS does both. For €29/month.
							</span>
						</p>
					</div>
				</div>
			</section>

			{/* ════════ SECTION 6: FAQ ════════ */}
			<section id="faq" className="py-24 px-6">
				<div className="max-w-3xl mx-auto">
					<h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
						Questions? Answers.
					</h2>

					<div>
						<FAQItem
							question="What happens after the 14-day trial?"
							answer="Your account converts to a paid plan. Cancel anytime before — no charge."
						/>
						<FAQItem
							question="Do I need to connect my Instagram/Facebook?"
							answer="Yes, you connect them in 2 clicks via OAuth. We never post without your approval unless you enable autopilot."
						/>
						<FAQItem
							question="Can I edit the AI-generated content?"
							answer="Absolutely. Every post is editable before publishing. The AI gives you a starting point, you make it perfect."
						/>
						<FAQItem
							question="What kind of content does it generate?"
							answer="Posts, carousel ideas, captions, hashtags, and stories — all tailored to your brand voice and industry."
						/>
						<FAQItem
							question="Is my data safe?"
							answer="Yes. We use encrypted connections, never share your data, and you can delete your account at any time."
						/>
						<FAQItem
							question="Can I switch plans later?"
							answer="Yes, upgrade or downgrade anytime from your billing settings."
						/>
					</div>
				</div>
			</section>

			{/* ════════ SECTION 7: FINAL CTA ════════ */}
			<section className="py-24 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="relative rounded-3xl overflow-hidden px-8 py-20 text-center">
						<div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-zinc-900 to-pink-900/30" />
						<div className="absolute inset-0 border border-purple-500/20 rounded-3xl" />

						<div className="relative z-10">
							<h2 className="text-4xl md:text-5xl font-bold mb-4">
								Your next post is 3 minutes away.
							</h2>
							<p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
								Set up your brand. Generate content. Publish on autopilot.
							</p>
							<Link
								href="/auth/signup"
								className="inline-flex items-center gap-2 h-14 px-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40"
							>
								Start your free trial
								<ArrowRight className="h-5 w-5" />
							</Link>
							<p className="text-sm text-zinc-500 mt-6">
								14 days free &nbsp;•&nbsp; No credit card &nbsp;•&nbsp; Cancel anytime
							</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
