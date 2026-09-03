"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "../Section";
import { PROJ_NAME } from "@/lib/constants/branding";

const FAQS = [
	{
		question: `How much does ${PROJ_NAME} cost for African organizers?`,
		answer: `${PROJ_NAME} is completely free to start! There are no monthly subscription fees or upfront software costs. We charge a simple 5% fee on successful paid ticket and voting transactions—you keep 95% of every transaction. Free events and RSVP registrations are 100% free with zero fees.`,
	},
	{
		question: "Which African payment methods and currencies are supported?",
		answer:
			"We support direct Mobile Money collections including MTN MoMo, Telecel Cash, AT Money, and M-Pesa. In addition, we accept international debit and credit cards (Visa, Mastercard) processed securely via Paystack, supporting GHS (Ghanaian Cedis), NGN (Nigerian Naira), KES (Kenyan Shillings), USD, and more.",
	},
	{
		question: "How does offline USSD voting (*928#) work?",
		answer:
			"Our proprietary USSD integration connects directly to African telecom networks. Anyone with any mobile phone (smartphone or basic feature phone) can dial *928#, enter the event code, select their nominee, and approve payment instantly from their Mobile Money wallet. Votes are counted in real-time alongside web votes.",
	},
	{
		question: "Can I customize our African festival page and ticket categories?",
		answer:
			"Absolutely! You can upload full-resolution artwork, fliers, and schedules. Create unlimited ticket tiers (Regular, VIP, VVIP, Backstage, Early Bird, Group Passes), limit capacity, and share direct checkout links to social media and WhatsApp.",
	},
	{
		question: "How fast are organizer payouts processed?",
		answer:
			"Organizers can request settlements directly into their local bank account or Mobile Money wallet. Payouts are fast and transparent, helping you cover event logistics, venue deposits, and artist bookings without delay.",
	},
	{
		question: "Can our gate security crew scan tickets offline at the venue?",
		answer:
			"Yes! You can assign dedicated scanner team members right from your dashboard. They can scan QR codes using their phone cameras, preventing duplicate tickets and counterfeit passes even under crowded or weak internet venue conditions.",
	},
];

export function LandingFAQ() {
	return (
		<Section
			id="faq"
			class="py-16 sm:py-20"
			content-class="space-y-8 lg:flex lg:space-y-0 gap-10 items-start"
		>
			{/* Left Header */}
			<div className="lg:max-w-md space-y-3">
				<h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight font-millik">
					Frequently Asked{" "}
					<span className="text-[#e88722] block sm:inline">
						Questions
					</span>
				</h2>

				<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
					Have questions about hosting your event or awards show in Africa? Here are answers to the most common queries.
				</p>
			</div>

			{/* Right Accordion List (Preline Clean Style) */}
			<div className="flex-1 w-full">
				<Accordion type="single" collapsible className="w-full space-y-2.5">
					{FAQS.map((faq, index) => (
						<AccordionItem
							key={faq.question}
							value={`item-${index}`}
							className="border border-border rounded-lg bg-card px-5 hover:border-[#e88722]/50 transition-colors shadow-none"
						>
							<AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 text-foreground hover:text-[#e88722] transition-colors">
								<span>{faq.question}</span>
							</AccordionTrigger>
							<AccordionContent className="pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								{faq.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</Section>
	);
}
