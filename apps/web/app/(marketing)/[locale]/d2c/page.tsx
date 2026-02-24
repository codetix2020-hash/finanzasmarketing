"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
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
	ChevronRight,
} from "lucide-react";

/* ──────────────────────────────────────────── */
/*  Keyframes (injected once)                   */
/* ──────────────────────────────────────────── */

const KEYFRAMES = `
@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
`;

/* ──────────────────────────────────────────── */
/*  FadeIn on scroll                            */
/* ──────────────────────────────────────────── */

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
	const [isInView, setIsInView] = useState(false);
	useEffect(() => {
		if (!ref.current) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) setIsInView(true);
			},
			{ threshold },
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, [ref, threshold]);
	return isInView;
}

function FadeIn({
	children,
	delay = 0,
	className = "",
}: {
	children: ReactNode;
	delay?: number;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref);
	return (
		<div
			ref={ref}
			className={className}
			style={{
				opacity: isInView ? 1 : 0,
				transform: isInView ? "translateY(0)" : "translateY(20px)",
				transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
				transitionDelay: `${delay}ms`,
			}}
		>
			{children}
		</div>
	);
}

/* ──────────────────────────────────────────── */
/*  Shimmer button wrapper                      */
/* ──────────────────────────────────────────── */

function ShimmerButton({
	href,
	children,
	className = "",
}: {
	href: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<Link href={href} className={`relative overflow-hidden ${className}`}>
			{children}
			<div
				className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
				style={{ animation: "shimmer 3s infinite" }}
			/>
		</Link>
	);
}

/* ──────────────────────────────────────────── */
/*  Hide parent layout navbar                   */
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
/*  D2C Navbar with smooth scroll               */
/* ──────────────────────────────────────────── */

function D2CNavbar() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
		e.preventDefault();
		document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
	};

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
					PilotSocials
				</Link>

				<div className="hidden md:flex items-center gap-8">
					{[
						{ label: "Features", href: "#features" },
						{ label: "Pricing", href: "#pricing" },
						{ label: "FAQ", href: "#faq" },
					].map((link) => (
						<a
							key={link.href}
							href={link.href}
							onClick={(e) => smoothScroll(e, link.href)}
							className="text-sm text-zinc-400 hover:text-white transition-colors"
						>
							{link.label}
						</a>
					))}
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
		<div>
			<button
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between py-4 px-5 text-left text-zinc-200 font-medium hover:text-white transition-colors"
			>
				<span className="pr-4">{question}</span>
				<ChevronRight className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
			</button>
			<div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 opacity-100 pb-4 px-5" : "max-h-0 opacity-0"}`}>
				<p className="text-zinc-400 text-sm leading-relaxed">{answer}</p>
			</div>
		</div>
	);
}

/* ──────────────────────────────────────────── */
/*  Page                                        */
/* ──────────────────────────────────────────── */

export default function D2CLandingPage() {
	useHideParentNav();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const heroStyle = (delay: number) => ({
		opacity: mounted ? 1 : 0,
		transform: mounted ? "translateY(0)" : "translateY(20px)",
		transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
		transitionDelay: `${delay}ms`,
	});

	return (
		<div className="bg-zinc-950 text-white">
			<style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

			{/* Noise overlay */}
			<div
				className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
				}}
			/>

			<D2CNavbar />

			{/* ════════ SECTION 1: HERO ════════ */}
			<section className="relative pt-28 pb-32 px-6 overflow-hidden">
				{/* Pulsing glow */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />

				<div className="relative max-w-6xl mx-auto text-center">
					{/* Badge */}
					<div style={heroStyle(0)}>
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-300 mb-8">
							<Sparkles className="h-4 w-4 text-purple-400" />
							AI-powered content engine
						</div>
					</div>

					{/* H1 line 1 */}
					<div style={heroStyle(100)}>
						<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6">
							Your brand posts.
							<br />
							{/* H1 line 2 – wrapped for extra delay */}
							<span
								className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent inline-block"
								style={heroStyle(200)}
							>
								While you sleep.
							</span>
						</h1>
					</div>

					{/* Subtitle */}
					<div style={heroStyle(300)}>
						<p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
							AI that knows your brand voice. Creates scroll-stopping content.
							Publishes on autopilot to Instagram & Facebook.
						</p>
					</div>

					{/* CTA Buttons */}
					<div style={heroStyle(400)}>
						<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
							<ShimmerButton
								href="/auth/signup"
								className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40"
							>
								<span className="relative z-10 flex items-center gap-2">
									Start free trial
									<ArrowRight className="h-4 w-4" />
								</span>
							</ShimmerButton>
							<a
								href="#how-it-works"
								onClick={(e) => {
									e.preventDefault();
									document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" });
								}}
								className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-full border border-zinc-700 text-zinc-300 font-semibold hover:border-zinc-500 hover:text-white transition-all duration-200"
							>
								See how it works
							</a>
						</div>
					</div>

					{/* Social proof */}
					<div style={{ ...heroStyle(500), transform: mounted ? "none" : "none" }}>
						<p className="text-sm text-zinc-500" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.8s ease", transitionDelay: "500ms" }}>
							14-day free trial &nbsp;•&nbsp; No credit card required &nbsp;•&nbsp; Cancel anytime
						</p>
					</div>

					{/* Product flow mockup */}
					<div style={heroStyle(600)} className="mt-20 relative">
						<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 pointer-events-none" />
						<div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-sm">
							<div className="flex items-center gap-3 mb-6">
								<div className="flex gap-1.5">
									<div className="w-3 h-3 rounded-full bg-zinc-700" />
									<div className="w-3 h-3 rounded-full bg-zinc-700" />
									<div className="w-3 h-3 rounded-full bg-zinc-700" />
								</div>
								<div className="flex-1 h-6 rounded-full bg-zinc-800 max-w-xs mx-auto" />
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								{/* Upload */}
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

								{/* Generate */}
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
										<span className="inline-block w-0.5 h-3.5 bg-purple-400 animate-pulse ml-0.5 align-middle" />
									</p>
									<div className="flex flex-wrap gap-1.5">
										{["#fashion", "#newdrop", "#summerstyle"].map((tag) => (
											<span key={tag} className="text-[11px] text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded">
												{tag}
											</span>
										))}
									</div>
								</div>

								{/* Publish */}
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
					<FadeIn>
						<h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
							Built for brands that move fast
						</h2>
					</FadeIn>

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
						].map((item, i) => {
							const Icon = item.icon;
							return (
								<FadeIn key={item.title} delay={i * 100}>
									<div className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-300 h-full">
										<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all duration-300">
											<Icon className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
										</div>
										<h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
										<p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
									</div>
								</FadeIn>
							);
						})}
					</div>
				</div>
			</section>

			{/* ════════ SECTION 3: FEATURES ════════ */}
			<section id="features" className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<FadeIn className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need</h2>
						<p className="text-zinc-400 text-lg">One platform. Zero busywork.</p>
					</FadeIn>

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
						].map((feature, i) => {
							const Icon = feature.icon;
							return (
								<FadeIn key={feature.title} delay={(i % 3) * 100}>
									<div className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-300 h-full">
										<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all duration-300">
											<Icon className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
										</div>
										<h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
										<p className="text-zinc-400 leading-relaxed text-sm">{feature.description}</p>
									</div>
								</FadeIn>
							);
						})}
					</div>
				</div>
			</section>

			{/* ════════ SECTION 4: HOW IT WORKS ════════ */}
			<section id="how-it-works" className="py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<FadeIn className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Up and running in 3 minutes</h2>
					</FadeIn>

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
						].map((step, i) => (
							<FadeIn key={step.num} delay={i * 150} className="relative text-center">
								<div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white shadow-lg shadow-purple-600/25 hover:scale-105 transition-transform duration-300">
									{step.num}
								</div>
								<h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
								<p className="text-zinc-400">{step.desc}</p>
							</FadeIn>
						))}
					</div>
				</div>
			</section>

			{/* ════════ SECTION 5: PRICING ════════ */}
			<section id="pricing" className="py-24 px-6">
				<div className="max-w-5xl mx-auto">
					<FadeIn className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-bold mb-4">Simple pricing. No surprises.</h2>
						<p className="text-zinc-400 text-lg">
							Start with a 14-day free trial. Upgrade when you&apos;re ready.
						</p>
					</FadeIn>

					<div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
						{/* PRO */}
						<FadeIn delay={0} className="h-full">
							<div className="relative flex flex-col rounded-2xl border-2 border-purple-500/60 bg-zinc-900/60 p-8 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 h-full">
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

								<ul className="space-y-3 flex-1">
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
									className="block w-full text-center py-3 mt-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20"
								>
									Start free trial →
								</Link>
							</div>
						</FadeIn>

						{/* AGENCY */}
						<FadeIn delay={150} className="h-full">
							<div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 hover:border-zinc-600 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 h-full">
								<h3 className="text-xl font-semibold mb-1">Agency</h3>
								<p className="text-zinc-500 text-sm mb-5">For teams & agencies</p>
								<div className="mb-6">
									<span className="text-5xl font-bold">€79</span>
									<span className="text-zinc-500">/mo</span>
								</div>

								<ul className="space-y-3 flex-1">
									{[
										"Unlimited posts",
										"5 brands",
										"Everything in Pro",
										"Priority support",
										"Analytics dashboard",
									].map((f) => (
										<li key={f} className="flex items-center gap-2.5 text-zinc-300 text-sm">
											<Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
											{f}
										</li>
									))}
								</ul>

								<Link
									href="/auth/signup"
									className="block w-full text-center py-3 mt-8 rounded-full border border-zinc-700 text-zinc-300 font-semibold hover:border-zinc-500 hover:text-white transition-all duration-200"
								>
									Start free trial →
								</Link>
							</div>
						</FadeIn>
					</div>
				</div>
			</section>

			{/* ════════ SECTION 5.5: HOW MUCH YOU SAVE ════════ */}
			<FadeIn className="py-20 px-6">
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
								PilotSocials does both. For €29/month.
							</span>
						</p>
					</div>
				</div>
			</FadeIn>

			{/* ════════ SECTION 6: FAQ ════════ */}
			<section id="faq" className="py-24 px-6">
				<div className="max-w-3xl mx-auto">
					<FadeIn className="text-center mb-12">
						<h2 className="text-4xl md:text-5xl font-bold mb-3">
							Questions? Answers.
						</h2>
						<p className="text-zinc-400 text-lg">
							Everything you need to know before getting started.
						</p>
					</FadeIn>

					<FadeIn delay={100}>
						<div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
							<FAQItem
								question="What happens after the 14-day trial?"
								answer="You'll get a reminder 3 days before your trial ends. If you love it, you'll automatically move to your chosen plan. If not, just cancel — no charge, no questions asked. Your content stays saved either way."
							/>
							<FAQItem
								question="How does the AI know my brand voice?"
								answer="During setup, you tell us about your brand — your industry, tone, audience, and products. The AI uses this to generate content that sounds like you wrote it. The more you use it, the better it gets. You can also define words to avoid, favorite emojis, and signature phrases."
							/>
							<FAQItem
								question="Do I need to connect my social accounts?"
								answer="Yes, and it takes about 30 seconds per platform. We use official OAuth — the same secure method used by Buffer, Hootsuite, and every major tool. We never store your password and you can disconnect anytime."
							/>
							<FAQItem
								question="Can I edit posts before they go live?"
								answer="Always. Every post starts as a draft that you can edit, rewrite, or trash. Auto-publish only kicks in if you explicitly turn it on. You're always in control."
							/>
							<FAQItem
								question="What if I manage multiple brands?"
								answer="The Agency plan supports up to 5 brands, each with their own voice, photos, and social accounts. Switch between them from one dashboard — no logging in and out."
							/>
							<FAQItem
								question="Is there a contract or commitment?"
								answer="None. Pay month to month. Cancel anytime from your settings — takes 10 seconds. We don't do annual lock-ins or hidden fees."
							/>
							<FAQItem
								question="What platforms do you support?"
								answer="Instagram and Facebook right now, with full auto-publishing. TikTok support is coming soon. We're focused on doing fewer platforms really well rather than half-supporting everything."
							/>
							<FAQItem
								question="How is this different from just using ChatGPT?"
								answer="ChatGPT generates generic text. It doesn't know your brand, can't schedule posts, can't publish to your accounts, and forgets everything between sessions. PilotSocials learns your brand once and handles the entire workflow — from content creation to publishing — on autopilot."
							/>
						</div>
					</FadeIn>
				</div>
			</section>

			{/* ════════ SECTION 7: FINAL CTA ════════ */}
			<FadeIn className="py-24 px-6">
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
							<ShimmerButton
								href="/auth/signup"
								className="inline-flex items-center gap-2 h-14 px-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-purple-600/25 hover:shadow-purple-500/40"
							>
								<span className="relative z-10 flex items-center gap-2">
									Start your free trial
									<ArrowRight className="h-5 w-5" />
								</span>
							</ShimmerButton>
							<p className="text-sm text-zinc-500 mt-6">
								14 days free &nbsp;•&nbsp; No credit card &nbsp;•&nbsp; Cancel anytime
							</p>
						</div>
					</div>
				</div>
			</FadeIn>
		</div>
	);
}
