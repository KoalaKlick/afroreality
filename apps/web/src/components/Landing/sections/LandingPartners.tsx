"use client";

import { Section } from "../Section";

const PARTNERS = [
	{ name: "MTN Mobile Money", country: "Ghana • Nigeria" },
	{ name: "Telecel Cash", country: "Ghana" },
	{ name: "AT Money", country: "Ghana" },
	{ name: "Paystack", country: "Pan-Africa" },
	{ name: "M-Pesa", country: "Kenya • East Africa" },
	{ name: "Mastercard", country: "Global" },
	{ name: "Visa", country: "Global" },
];

export function LandingPartners() {
	return (
		<Section contentClassName="space-y-6">
			<p className="text-foreground text-center font-medium text-sm sm:text-base">
				Powered by trusted <span className="text-[#e88722] font-semibold">African</span> payment &amp; telecom partners:
			</p>

			{/* Marquee Container with Linear Fade Mask */}
			<div className="relative overflow-hidden w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
				<div className="flex w-max animate-marquee gap-8 sm:gap-14 py-3">
					{/* First set */}
					{PARTNERS.map((partner, idx) => (
						<div
							key={`p1-${partner.name}-${idx}`}
							className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border/70 shadow-xs text-foreground font-bold text-sm tracking-tight shrink-0 transition-transform hover:scale-105 hover:border-[#e88722]/50"
						>
							<div className="size-2 rounded-full bg-[#e88722]" />
							<span>{partner.name}</span>
							<span className="text-[10px] text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">
								{partner.country}
							</span>
						</div>
					))}

					{/* Duplicate set for seamless loop */}
					{PARTNERS.map((partner, idx) => (
						<div
							key={`p2-${partner.name}-${idx}`}
							className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border/70 shadow-xs text-foreground font-bold text-sm tracking-tight shrink-0 transition-transform hover:scale-105 hover:border-[#e88722]/50"
							aria-hidden="true"
						>
							<div className="size-2 rounded-full bg-[#ca0808]" />
							<span>{partner.name}</span>
							<span className="text-[10px] text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">
								{partner.country}
							</span>
						</div>
					))}

					{/* Triplicate for large displays */}
					{PARTNERS.map((partner, idx) => (
						<div
							key={`p3-${partner.name}-${idx}`}
							className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border/70 shadow-xs text-foreground font-bold text-sm tracking-tight shrink-0 transition-transform hover:scale-105 hover:border-[#e88722]/50"
							aria-hidden="true"
						>
							<div className="size-2 rounded-full bg-[#e88722]" />
							<span>{partner.name}</span>
							<span className="text-[10px] text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">
								{partner.country}
							</span>
						</div>
					))}
				</div>
			</div>
		</Section>
	);
}
