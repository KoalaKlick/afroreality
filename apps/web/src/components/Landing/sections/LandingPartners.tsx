"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import GreekKeyPattern from "@/assets/greek-key-pattern.svg";

// Separate standalone SVG partner logos
import MtnMomoLogo from "@/assets/partners/mtn-momo.svg";
import TelecelLogo from "@/assets/partners/telecel-cash.svg";
import AtMoneyLogo from "@/assets/partners/at-money.svg";
import PaystackLogo from "@/assets/partners/paystack.svg";
import MPesaLogo from "@/assets/partners/mpesa.svg";
import OrangeMoneyLogo from "@/assets/partners/orange-money.svg";
import WaveLogo from "@/assets/partners/wave.svg";
import MastercardLogo from "@/assets/partners/mastercard.svg";
import VisaLogo from "@/assets/partners/visa.svg";
import FlutterwaveLogo from "@/assets/partners/flutterwave.svg";
import InstantEftLogo from "@/assets/partners/instant-eft.svg";

interface Partner {
	name: string;
	country: string;
	logo: React.ComponentType<{ className?: string }>;
}

const PARTNERS: Partner[] = [
	{ name: "MTN MoMo", country: "Ghana • Nigeria", logo: MtnMomoLogo },
	{ name: "Telecel Cash", country: "Ghana", logo: TelecelLogo },
	{ name: "AT Money", country: "Ghana", logo: AtMoneyLogo },
	{ name: "Paystack", country: "Pan-Africa", logo: PaystackLogo },
	{ name: "M-Pesa", country: "Kenya • East Africa", logo: MPesaLogo },
	{ name: "Orange Money", country: "Côte d'Ivoire • West Africa", logo: OrangeMoneyLogo },
	{ name: "Wave", country: "Senegal • West Africa", logo: WaveLogo },
	{ name: "Mastercard", country: "Global Cards", logo: MastercardLogo },
	{ name: "Visa", country: "Global Cards", logo: VisaLogo },
	{ name: "Flutterwave", country: "Pan-Africa", logo: FlutterwaveLogo },
	{ name: "Instant EFT", country: "South Africa", logo: InstantEftLogo },
];

export function LandingPartners() {
	const containerRef = useRef<HTMLDivElement>(null);

	// Track scroll progress immediately as the section enters the viewport
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start end", "end start"],
	});

	// Smooth spring-damped scroll transform: reacts immediately to any scroll gesture with zero dead zone
	const xRaw = useTransform(scrollYProgress, [0, 1], [80, -1300]);
	const x = useSpring(xRaw, {
		stiffness: 55,
		damping: 20,
		restDelta: 0.001,
	});

	return (
		<section
			ref={containerRef}
			className="relative py-8 sm:py-12 md:py-10 overflow-hidden select-none bg-background"
			aria-label="African Payment and Telecom Partners"
		>
			{/* Greek Key Pattern Background in Brand Secondary */}
			{/* <div
				className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-10"
				aria-hidden="true"
			>
				<GreekKeyPattern className="w-full h-full text-secondary-500" />
			</div> */}

			{/* Full-width Flow Track with sharp edges */}
			<div className="relative z-10 w-full overflow-hidden">
				<motion.div
					style={{ x }}
					className="flex items-center whitespace-nowrap will-change-transform transform-gpu py-3 pl-0 pr-4"
				>
					{/* THE "PUSHER" - Starting end bleeds offscreen to the left; only the rounded right end is visible with all text */}
					<div
						tabIndex={0}
						role="button"
						aria-label="African payment & telecom partners info"
						className="relative shrink-0 h-18 sm:h-22 md:h-24 pl-6 pr-6 sm:pl-10 sm:pr-8 md:pr-10 rounded-r-full rounded-l-none bg-primary text-primary-foreground w-auto max-w-[92vw] md:max-w-none md:min-w-[32rem] flex justify-end items-center gap-3.5 sm:gap-5 group cursor-pointer transition-all duration-300 hover:brightness-105 active:scale-[0.99] shadow-xl shadow-primary/20 border-y border-r border-white/15 before:absolute before:right-full before:inset-y-0 before:w-[200vw] before:bg-primary before:border-y before:border-white/15 before:pointer-events-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring select-none mr-4"
					>
						<div className="flex flex-col items-end text-right leading-tight">
							<span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-white/80">
								Instant • Verified
							</span>
							<span className="font-semibold text-white text-xs sm:text-base md:text-xl tracking-tight">
								Powered by trusted <span className="font-bold text-[#f8dcbe]">African</span> payment &amp; telecom partners:
							</span>
						</div>
						<div className="size-10 sm:size-12 md:size-14 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-md group-hover:bg-[#f8dcbe] group-hover:scale-105 transition-all">
							<ArrowRight size={20} className="sm:size-5 md:size-6 group-hover:translate-x-1 transition-transform text-primary" />
						</div>
					</div>

					{/* PARTNER CARDS - Being "Pushed" (Primary Set) */}
					{PARTNERS.map((partner, i) => (
						<motion.div
							key={`p1-${partner.name}-${i}`}
							whileHover={{ scale: 1.06, y: -3 }}
							transition={{ type: "spring", stiffness: 400, damping: 22 }}
							className="shrink-0 flex items-stretch h-14 sm:h-16 md:h-18 bg-sepia-50 dark:bg-card hover:bg-sepia-100 dark:hover:bg-card/80 hover:shadow-md transition-all cursor-pointer group shadow-xs mr-3 sm:mr-4 rounded-xl overflow-hidden"
						>
							<div className="h-full aspect-square shrink-0 flex items-center justify-center overflow-hidden p-0">
								<partner.logo className="size-full" />
							</div>
							<div className="flex flex-col justify-center px-3.5 sm:px-5 py-2">
								<div className="flex items-center gap-1.5 sm:gap-2">
									<span className="font-bold text-xs sm:text-base md:text-lg text-muted-foreground group-hover:text-primary transition-colors tracking-tight">
										{partner.name}
									</span>
								</div>
								<span className="text-[10px] sm:text-xs text-muted-foreground font-normal tracking-normal">
									{partner.country}
								</span>
							</div>
						</motion.div>
					))}

					{/* PARTNER CARDS - Extended Set for continuous scroll length */}
					{PARTNERS.map((partner, i) => (
						<motion.div
							key={`p2-${partner.name}-${i}`}
							whileHover={{ scale: 1.06, y: -3 }}
							transition={{ type: "spring", stiffness: 400, damping: 22 }}
							className="shrink-0 flex items-stretch h-14 sm:h-16 md:h-18 bg-sepia-50 dark:bg-card hover:bg-sepia-100 dark:hover:bg-card/80 hover:shadow-md transition-all cursor-pointer group shadow-xs mr-3 sm:mr-4 rounded-xl overflow-hidden"
						>
							<div className="h-full aspect-square shrink-0 flex items-center justify-center overflow-hidden p-0">
								<partner.logo className="size-full" />
							</div>
							<div className="flex flex-col justify-center px-3.5 sm:px-5 py-2">
								<div className="flex items-center gap-1.5 sm:gap-2">
									<span className="font-bold text-xs sm:text-base md:text-lg text-foreground group-hover:text-primary transition-colors tracking-tight">
										{partner.name}
									</span>
								</div>
								<span className="text-[10px] sm:text-xs text-muted-foreground font-normal tracking-normal">
									{partner.country}
								</span>
							</div>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
