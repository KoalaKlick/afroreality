"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
	{
		question: "What payment methods can my attendees use?",
		answer:
			"We integrate natively with Paystack to support MTN Mobile Money, Telecel Cash, AT Money, and all Visa & Mastercard debit/credit cards. Attendees can also dial our USSD shortcode (*928#) to pay directly through their mobile carrier on feature phones.",
	},
	{
		question: "How does USSD offline ticketing and voting work?",
		answer:
			"When you enable USSD for your event, we assign a dedicated shortcode. Anyone without a smartphone or internet connection can dial *928#, select your event or nominee, and complete payment via Mobile Money prompt. Digital pass SMS notifications are delivered immediately.",
	},
	{
		question: "How fast do organizers receive payouts?",
		answer:
			"Ticket and vote revenues are credited to your organizer wallet balance in real time. You can request payouts directly to your local bank account or Mobile Money number at any time, with funds settling within minutes to 24 hours depending on the destination bank.",
	},
	{
		question: "Can I create multiple ticket tiers with capacity limits?",
		answer:
			"Yes. You can create VIP, Early Bird, Regular, Backstage, and Group Table tickets. You can configure individual price points, total ticket allocations, active sale windows, and limit max tickets per order to prevent scalping.",
	},
	{
		question: "How does the gate check-in scanner work?",
		answer:
			"Every ticket comes with an encrypted tamper-proof QR code. Your gate staff can log in on any smartphone camera to scan tickets in under 500 milliseconds. The scanner detects duplicate scans instantly and supports local caching during spotty network conditions.",
	},
	{
		question: "Can I accept public nominations before voting commences?",
		answer:
			"Absolutely. You can open a Public Nomination portal where aspiring nominees or their fans can submit photos, portfolios, and social links. You can charge an optional nomination fee and approve or reject entries before opening public voting.",
	},
];

export function LandingFAQ() {
	const [openIdx, setOpenIdx] = useState<number | null>(0);

	const toggle = (idx: number) => {
		setOpenIdx(openIdx === idx ? null : idx);
	};

	return (
		<section id="faq" className="py-20 md:py-28 relative">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
					<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
						<HelpCircle className="size-3.5" />
						<span>Got Questions?</span>
					</div>
					<h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
						Frequently Asked Questions
					</h2>
					<p className="text-muted-foreground text-sm sm:text-base">
						Everything you need to know about our ticketing, live voting, USSD, and payouts.
					</p>
				</div>

				{/* Accordion Items */}
				<div className="space-y-4">
					{FAQS.map((faq, idx) => {
						const isOpen = openIdx === idx;
						return (
							<div
								key={faq.question}
								className={cn(
									"rounded-2xl border transition-all duration-200 overflow-hidden",
									isOpen
										? "bg-card border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20"
										: "bg-card/60 border-border/60 hover:border-border",
								)}
							>
								<button
									type="button"
									onClick={() => toggle(idx)}
									className="w-full flex items-center justify-between p-5 sm:p-6 text-left transition-colors"
								>
									<span className="font-bold text-base sm:text-lg text-foreground pr-4">
										{faq.question}
									</span>
									<ChevronDown
										className={cn(
											"size-5 shrink-0 text-muted-foreground transition-transform duration-300",
											isOpen && "rotate-180 text-emerald-600",
										)}
									/>
								</button>

								<AnimatePresence initial={false}>
									{isOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.25, ease: "easeInOut" }}
										>
											<div className="px-5 pb-6 sm:px-6 sm:pb-6 text-sm sm:text-base text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
												{faq.answer}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
