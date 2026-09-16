"use client";

import { useRef } from "react";
import Image, { type StaticImageData } from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";

// Partner & Telecom logos from tawny + Paystack
import MtnLogo from "@/assets/partners/mtn.svg";
import TelecelLogo from "@/assets/partners/telecel-logo.webp";
import AtLogo from "@/assets/partners/at-logo.webp";
import PaystackLogo from "@/assets/Paystack_Logo.png";
import MastercardLogo from "@/assets/partners/mastercard.svg";
import VisaLogo from "@/assets/partners/visa.svg";

interface Partner {
	name: string;
	logo: React.ComponentType<{ className?: string }> | StaticImageData;
	isImage?: boolean;
}

const PARTNERS: Partner[] = [
	{ name: "MTN", logo: MtnLogo, isImage: false },
	{ name: "Telecel", logo: TelecelLogo, isImage: true },
	{ name: "AirtelTigo", logo: AtLogo, isImage: true },
	{ name: "Paystack", logo: PaystackLogo, isImage: true },
	{ name: "MasterCard", logo: MastercardLogo, isImage: false },
	{ name: "Visa", logo: VisaLogo, isImage: false },
];

function PartnerLogoItem({ partner }: { partner: Partner }) {
	if (partner.isImage) {
		return (
			<Image
				src={partner.logo as StaticImageData}
				alt={partner.name}
				className="h-7 sm:h-8 md:h-10 w-auto object-contain"
			/>
		);
	}
	const Logo = partner.logo as React.ComponentType<{ className?: string }>;
	return (
		<Logo
			className={`h-7 sm:h-8 md:h-10 w-auto object-contain ${
				partner.name === "MTN" ? "dark:invert" : ""
			}`}
		/>
	);
}

export function LandingPartners() {
	const containerRef = useRef<HTMLDivElement>(null);

	// Track scroll progress immediately as the section enters the viewport
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start end", "end start"],
	});

	// Smooth spring-damped scroll transform: reacts immediately to any scroll gesture with zero dead zone
	const xRaw = useTransform(scrollYProgress, [0, 1], [80, -1200]);
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
						className="relative shrink-0 h-18 sm:h-22 md:h-24 pl-10 pr-6 sm:pl-10 sm:pr-8 md:pr-10 rounded-r-full rounded-l-none bg-muted text-foreground w-auto max-w-[92vw] md:max-w-none md:min-w-[32rem] flex justify-end items-center gap-3.5 sm:gap-5 transition-all duration-300 hover:bg-muted/80 active:scale-[0.99] shadow-md shadow-black/5 border-y border-r border-border before:absolute before:right-full before:inset-y-0 before:w-[200vw] before:bg-muted before:border-y before:border-border before:pointer-events-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring select-none mr-6 sm:mr-8"
					>
						<div className="flex flex-col items-end text-right leading-tight">
							<span className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold text-muted-foreground">
								Instant • Verified
							</span>
							<span className="font-semibold text-foreground text-xs sm:text-base md:text-xl tracking-tight">
								Powered by trusted <span className="font-bold text-primary">African</span> payment &amp; telecom partners:
							</span>
						</div>
						<div className="size-10 sm:size-12 md:size-14 rounded-full bg-background border border-border text-foreground flex items-center justify-center shrink-0 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
							<ArrowRight size={20} className="sm:size-5 md:size-6 group-hover:translate-x-1 transition-transform" />
						</div>
					</div>

					{/* PARTNER LOGOS - Being "Pushed" (Seamless repeating sets) */}
					{[1, 2, 3, 4].flatMap((setNum) =>
						PARTNERS.map((partner, i) => (
							<motion.div
								key={`p${setNum}-${partner.name}-${i}`}
								whileHover={{ scale: 1.1, y: -2 }}
								transition={{ type: "spring", stiffness: 400, damping: 22 }}
								className="shrink-0 flex items-center justify-center px-4 sm:px-6 md:px-8 py-2 cursor-pointer transition-opacity opacity-90 hover:opacity-100"
							>
								<PartnerLogoItem partner={partner} />
							</motion.div>
						))
					)}
				</motion.div>
			</div>
		</section>
	);
}
