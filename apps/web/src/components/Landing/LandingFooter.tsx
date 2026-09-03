"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowUp } from "lucide-react";
import { PROJ_NAME } from "@/lib/constants/branding";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = {
	product: [
		{ label: "All Events", href: "/events" },
		{ label: "Features", href: "/#features" },
		{ label: "How It Works", href: "/#how-it-works" },
		{ label: "Pricing Calculator", href: "/#pricing" },
		{ label: "USSD Offline Access", href: "/#features" },
	],
	organizers: [
		{ label: "Create an Event", href: "/register" },
		{ label: "Organizer Login", href: "/login" },
		{ label: "Gate Scanner App", href: "/login" },
		{ label: "Instant Payouts", href: "/#pricing" },
	],
	resources: [
		{ label: "Frequently Asked Questions", href: "/#faq" },
		{ label: "Contact Support", href: "mailto:support@fextiva.com" },
		{ label: "Privacy Policy", href: "#" },
		{ label: "Terms of Service", href: "#" },
	],
};

export function LandingFooter() {
	const currentYear = new Date().getFullYear();

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<footer className="border-t border-border/60 bg-card/60 backdrop-blur-md pt-16 pb-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-border/50">
					{/* Brand Bio */}
					<div className="md:col-span-4 space-y-4">
						<Link href="/" className="inline-flex items-center gap-2.5">
							<div className="relative size-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center p-1.5">
								<Image
									src="/logo.svg"
									alt={`${PROJ_NAME} logo`}
									width={36}
									height={36}
									className="object-contain"
								/>
							</div>
							<span className="font-extrabold text-2xl tracking-tight text-foreground lowercase">
								{PROJ_NAME}
							</span>
						</Link>

						<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
							Scalable event management, digital ticketing, live voting, and
							offline USSD infrastructure designed specifically for African creators and audiences.
						</p>

						<div className="pt-2 flex items-center gap-3">
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
								<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
								All Systems Operational
							</span>
						</div>
					</div>

					{/* Navigation Links Columns */}
					<div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
						{/* Product */}
						<div className="space-y-3">
							<h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
								Platform
							</h4>
							<ul className="space-y-2.5 text-sm">
								{FOOTER_LINKS.product.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="text-muted-foreground hover:text-foreground transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Organizers */}
						<div className="space-y-3">
							<h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
								Organizers
							</h4>
							<ul className="space-y-2.5 text-sm">
								{FOOTER_LINKS.organizers.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="text-muted-foreground hover:text-foreground transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Resources & Support */}
						<div className="space-y-3 col-span-2 sm:col-span-1">
							<h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
								Resources &amp; Legal
							</h4>
							<ul className="space-y-2.5 text-sm">
								{FOOTER_LINKS.resources.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="text-muted-foreground hover:text-foreground transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				{/* Bottom Credits */}
				<div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
					<p>
						&copy; {currentYear} {PROJ_NAME}. All rights reserved.
					</p>

					<div className="flex items-center gap-4">
						<span className="flex items-center gap-1">
							Engineered with <Heart className="size-3.5 text-red-500 fill-current" /> for Africa
						</span>

						<Button
							variant="ghost"
							size="icon"
							onClick={scrollToTop}
							className="size-8 rounded-full hover:bg-muted"
							aria-label="Scroll to top"
						>
							<ArrowUp className="size-4" />
						</Button>
					</div>
				</div>
			</div>
		</footer>
	);
}
