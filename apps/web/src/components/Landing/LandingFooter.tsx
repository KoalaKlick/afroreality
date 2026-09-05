"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { PROJ_NAME } from "@/lib/constants/branding";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { getUssdRootDialCode } from "@/lib/utils/ussd";

export function LandingFooter() {
	const currentYear = new Date().getFullYear();
	const ussdCode = getUssdRootDialCode();

	const footerLinks = {
		product: [
			{ label: "Features", href: "/#features" },
			{ label: "Pricing", href: "/#pricing" },
			{ label: "African Events", href: "/events" },
			{ label: "Live USSD Voting", href: "/#features" },
		],
		company: [
			{ label: "About Us", href: "#" },
			{ label: "Our Story", href: "#" },
			{ label: "Careers", href: "#" },
			{ label: "Contact Support", href: "#" },
		],
		resources: [
			{ label: "Documentation", href: "#" },
			{ label: "Organizer Guide", href: "#" },
			{ label: `USSD Dial Code (${ussdCode})`, href: "#" },
			{ label: "System Status", href: "#" },
		],
		legal: [
			{ label: "Privacy Policy", href: "/privacy" },
			{ label: "Terms of Service", href: "/terms" },
			{ label: "Merchant Agreement", href: "#" },
		],
	};

	return (
		<footer className="border-t border-border mt-24 bg-card/40">
			{/* Pan-African Tri-Color Strip */}
			<PanAfricanDivider className="h-px opacity-70" />

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-6">
				{/* Main Footer Body */}
				<div className="py-12 lg:py-16">
					<div className="grid grid-cols-2 md:grid-cols-6 gap-8">
						{/* Brand Column */}
						<div className="col-span-2 flex flex-col justify-between gap-6">
							<Link href="/" className="inline-block">
								<Image
									src="/logo.svg"
									alt={`${PROJ_NAME} Logo`}
									width={130}
									height={40}
									className="h-10 w-auto object-contain"
								/>
							</Link>

							<p className="text-foreground text-sm leading-relaxed max-w-sm">
								Powering seamless ticketing, live audience voting, and offline USSD ({ussdCode}) for festivals, awards, and gatherings across Africa and the diaspora.
							</p>
						</div>

						{/* Links Columns */}
						<div className="grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between col-span-2 md:col-span-4">
							{/* Product */}
							<div>
								<h4 className="font-semibold text-sm mb-4 text-foreground">
									Product
								</h4>
								<ul className="space-y-3">
									{footerLinks.product.map((link) => (
										<li key={link.label}>
											<Link
												href={link.href}
												className="text-sm text-muted-foreground hover:text-[#e88722] transition-colors"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>

							{/* Company */}
							<div>
								<h4 className="font-semibold text-sm mb-4 text-foreground">
									Company
								</h4>
								<ul className="space-y-3">
									{footerLinks.company.map((link) => (
										<li key={link.label}>
											<Link
												href={link.href}
												className="text-sm text-muted-foreground hover:text-[#e88722] transition-colors"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>

							{/* Resources */}
							<div>
								<h4 className="font-semibold text-sm mb-4 text-foreground">
									Resources
								</h4>
								<ul className="space-y-3">
									{footerLinks.resources.map((link) => (
										<li key={link.label}>
											<Link
												href={link.href}
												className="text-sm text-muted-foreground hover:text-[#e88722] transition-colors"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>

							{/* Legal */}
							<div>
								<h4 className="font-semibold text-sm mb-4 text-foreground">
									Legal
								</h4>
								<ul className="space-y-3">
									{footerLinks.legal.map((link) => (
										<li key={link.label}>
											<Link
												href={link.href}
												className="text-sm text-muted-foreground hover:text-[#e88722] transition-colors"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground">
					<p>
						&copy; {currentYear} <span className="capitalize">{PROJ_NAME}</span>.
						All rights reserved.
					</p>

					<p className="flex items-center gap-1.5 text-muted-foreground">
						Made with{" "}
						<Heart className="size-4 text-[#ca0808] fill-[#ca0808]" /> across
						Africa
					</p>
				</div>
			</div>
		</footer>
	);
}
