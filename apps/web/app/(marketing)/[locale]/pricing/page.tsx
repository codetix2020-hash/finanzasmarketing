import { PricingSection } from "../(home)/PricingSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Pricing | PilotSocials",
	description:
		"Simple, transparent pricing. Start free for 14 days. No credit card required.",
};

export default function PricingPage() {
	return (
		<div className="bg-zinc-950 pt-24 text-white">
			<section className="py-16 md:py-20">
				<div className="container">
					<div className="mx-auto max-w-3xl text-center">
						<h1 className="text-4xl font-bold md:text-5xl">
							Simple, transparent{" "}
							<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								pricing
							</span>
						</h1>
						<p className="mt-4 text-lg text-zinc-400">
							Start free for 14 days. No credit card required. Cancel anytime.
						</p>
					</div>
				</div>
			</section>
			<PricingSection />
		</div>
	);
}
