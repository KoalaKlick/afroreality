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
		question: `How does pricing work on ${PROJ_NAME}?`,
		answer: `${PROJ_NAME} operates on a pure pay-as-you-go model. There are zero signup fees, zero monthly subscriptions, and zero hidden maintenance charges. Free events and community gatherings are 100% free forever. For paid tickets and voting, we only deduct a small fee per successful transaction. You keep the rest with direct, transparent payouts.`,
	},
	{
		question: "Can I host free events just to advertise our brand or community?",
		answer:
			"Yes, absolutely. Unlike other platforms that only care about ticket commissions, Fextiva lets you host free general events, brand launches, and community festivals to gain reach and trust. You get full customization with your own colors, logo, and event map at no cost.",
	},
	{
		question: "How much can I customize my event page?",
		answer:
			"Completely. Every event page is designed to look like your own bespoke website. You choose your brand colors, upload your organizer logo and fliers, list your sponsors, and display an interactive venue map so your audience connects with your brand.",
	},
	{
		question: "How does offline USSD voting (*928#) work?",
		answer:
			"Anyone with any phone—smartphones or basic keypad phones—can dial *928#, enter your event code, select their contestant, and confirm payment with their Mobile Money PIN. Votes tally in real time alongside online votes on your live dashboard.",
	},
	{
		question: "Which payment methods and currencies are supported?",
		answer:
			"We support direct Mobile Money collections including MTN MoMo, Telecel Cash, AT Money, and M-Pesa, alongside Visa and Mastercard processed securely through Paystack. Currencies include GHS (Ghanaian Cedis), NGN (Nigerian Naira), KES, USD, and more.",
	},
	{
		question: "How fast do organizers receive payouts?",
		answer:
			"All event earnings settle directly into your organizer wallet in real time. You can request payouts straight to your Mobile Money wallet or bank account whenever you want, with clear accounting and zero surprise deductions.",
	},
	{
		question: "How does gate security verify tickets at the venue?",
		answer:
			"Assign fast scanner roles to your gate crew from your dashboard. They can scan attendee QR codes using their phone cameras in under a second, stopping counterfeit passes and duplicate entries on the spot.",
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
					<span className="text-primary block sm:inline">
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
							className="border border-border rounded-lg bg-card px-5 hover:border-primary/50 transition-colors shadow-none"
						>
							<AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline py-4 text-foreground hover:text-primary transition-colors">
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
