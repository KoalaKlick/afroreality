"use client";

import { useEffect, useState, useRef } from "react";
import { Section } from "../Section";
import { cn } from "@/lib/utils";

interface StepItem {
	step: number;
	title: string;
	description: string;
	dotColor: string;
	dotClass: string;
	activeDotClass: string;
	numberColor: string;
}

const STEPS: StepItem[] = [
	{
		step: 1,
		title: "SIGN UP",
		dotColor: "#53967a",
		dotClass: "bg-[#53967a]",
		activeDotClass: "ring-4 ring-[#53967a]/25 scale-125",
		numberColor: "text-[#53967a]",
		description: "Create your free account and set up your profile in seconds.",
	},
	{
		step: 2,
		title: "CREATE EVENT",
		dotColor: "#e88722",
		dotClass: "bg-[#e88722]",
		activeDotClass: "ring-4 ring-[#e88722]/25 scale-125",
		numberColor: "text-[#e88722]",
		description: "Choose your event type and customize with our intuitive builder.",
	},
	{
		step: 3,
		title: "SHARE & PROMOTE",
		dotColor: "#ca0808",
		dotClass: "bg-[#ca0808]",
		activeDotClass: "ring-4 ring-[#ca0808]/25 scale-125",
		numberColor: "text-[#ca0808]",
		description: "Share your event page and engage with your audience effortlessly.",
	},
	{
		step: 4,
		title: "TRACK RESULTS",
		dotColor: "#64748b",
		dotClass: "bg-slate-500",
		activeDotClass: "ring-4 ring-slate-500/25 scale-125",
		numberColor: "text-slate-500",
		description: "Monitor live engagement and analyze performance in real-time.",
	},
];

export function LandingHowItWorks() {
	const [activeStep, setActiveStep] = useState(1);
	const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		const handleScroll = () => {
			const viewportCenter = window.innerHeight * 0.45;

			stepRefs.current.forEach((el, index) => {
				if (!el) return;
				const rect = el.getBoundingClientRect();
				if (rect.top <= viewportCenter && rect.bottom >= viewportCenter - 60) {
					setActiveStep(index + 1);
				}
			});
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<Section
			id="how-it-works"
			class="mt-20 md:mt-24 py-12 sm:py-16"
			content-class="scroll-mt-24"
		>
			<div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start relative">
				{/* Left side - Title (Sticky to parent container on desktop) */}
				<div className="lg:w-1/3 lg:sticky lg:top-28 lg:self-start space-y-3 shrink-0">
					<p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground font-semibold">
						THE FLOW
					</p>

					<h2 className="text-5xl lg:text-6xl font-black uppercase leading-none tracking-tight text-foreground font-millik">
						HOW IT<br />
						<span className="text-primary">WORKS.</span>
					</h2>

					<div className="w-12 h-1 bg-foreground my-4" />

					<p className="text-muted-foreground max-w-sm text-sm sm:text-base leading-relaxed">
						A streamlined process designed to take your event from concept to reality in record time.
						Professional, powerful and ridiculously easy.
					</p>
				</div>

				{/* Right side - Steps timeline with scroll-active effect */}
				<div className="lg:w-2/3 space-y-0 w-full">
					{STEPS.map((item, index) => {
						const isLast = index === STEPS.length - 1;
						const isActive = activeStep === item.step;
						const isPassed = activeStep > item.step;

						return (
							<div
								key={item.step}
								ref={(el) => {
									stepRefs.current[index] = el;
								}}
								className={cn(
									"relative flex items-start gap-5 sm:gap-8 transition-opacity duration-300",
									isActive ? "opacity-100" : isPassed ? "opacity-75" : "opacity-40",
								)}
							>
								{/* Timeline dot and dynamic connecting line */}
								<div className="flex flex-col items-center self-stretch shrink-0 pt-2">
									<div
										className={cn(
											"w-3 h-3 rounded-full shrink-0 transition-all duration-300",
											item.dotClass,
											isActive && item.activeDotClass,
										)}
									/>
									{!isLast && (
										<div className="w-px flex-1 bg-border my-1 min-h-[90px] sm:min-h-[120px] relative overflow-hidden">
											{/* Filled progress overlay if step is passed or active */}
											<div
												className={cn(
													"absolute inset-x-0 top-0 transition-all duration-500",
													isPassed ? "h-full bg-foreground/40" : isActive ? "h-1/2 bg-foreground/30" : "h-0",
												)}
											/>
										</div>
									)}
								</div>

								{/* Step number: 01, 02, 03, 04 in large display with scroll active transition */}
								<div
									className={cn(
										"text-6xl sm:text-8xl font-black leading-none select-none shrink-0 font-millik transition-all duration-300",
										item.numberColor,
										isActive ? "opacity-90 scale-105" : "opacity-25",
									)}
								>
									{String(item.step).padStart(2, "0")}
								</div>

								{/* Content */}
								<div className="pt-1.5 sm:pt-3 pb-10 sm:pb-14 space-y-1 sm:space-y-1.5 flex-1">
									<h3 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-foreground font-millik transition-colors duration-200">
										{item.title}
									</h3>
									<p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
										{item.description}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</Section>
	);
}
