import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale, CheckCircle2, AlertTriangle, ShieldCheck, Mail } from "lucide-react";
import { PROJ_NAME } from "@/lib/constants/branding";
import { LandingFooter } from "@/components/Landing/LandingFooter";

export const metadata: Metadata = {
	title: `Terms of Service | ${PROJ_NAME}`,
	description: `Read the Terms of Service governing the use of ${PROJ_NAME}'s event management, ticketing, and voting platform.`,
};

export default function TermsOfServicePage() {
	const lastUpdated = "September 5, 2026";
	const effectiveDate = "September 1, 2026";

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
			<main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
				{/* Top back navigation */}
				<div className="mb-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="size-3.5" />
						Back to Home
					</Link>
				</div>

				{/* Header Section */}
				<header className="border-b border-border pb-8 mb-10">
					<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
						<Scale className="size-4 text-primary" />
						<span>Legal &amp; Compliance</span>
					</div>
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
						Terms of Service
					</h1>
					<div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
						<span>Effective date: {effectiveDate}</span>
						<span>•</span>
						<span>Last updated: {lastUpdated}</span>
					</div>
					<p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
						These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User,&rdquo; &ldquo;Organizer,&rdquo; &ldquo;Attendee,&rdquo; or &ldquo;Nominee&rdquo;) and <strong className="text-foreground capitalize">{PROJ_NAME}</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), governing your access to and use of our event hosting, ticketing, voting, and USSD services.
					</p>
				</header>

				{/* Content Body */}
				<div className="space-y-10 text-sm sm:text-base text-muted-foreground leading-relaxed">
					{/* Section 1 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							1. Acceptance of Terms
						</h2>
						<p>
							By accessing, browsing, or using <span className="capitalize">{PROJ_NAME}</span>, creating an account, buying a ticket, submitting a nominee, or casting a vote, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link href="/privacy" className="text-primary underline hover:text-primary/80">Privacy Policy</Link>. If you do not agree to these Terms, you must not access or use our platform.
						</p>
					</section>

					{/* Section 2 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							2. Account Registration &amp; Security
						</h2>
						<p>
							To utilize certain features, such as organizing events or managing ticketing dashboards, you must register for an account.
						</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li><strong className="text-foreground">Accurate Information:</strong> You agree to provide accurate, current, and complete information during registration and keep your account details up to date.</li>
							<li><strong className="text-foreground">Authentication via Third Parties:</strong> When signing up using third-party single sign-on (such as Google OAuth), you authorize us to receive account profile and email information as described in our Privacy Policy.</li>
							<li><strong className="text-foreground">Credential Security:</strong> You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use or security breach.</li>
						</ul>
					</section>

					{/* Section 3 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							3. Platform Role &amp; Services
						</h2>
						<p>
							<span className="capitalize">{PROJ_NAME}</span> provides digital software infrastructure enabling event organizers to publish events, distribute and sell tickets, conduct voting contests, and facilitate offline USSD interactions.
						</p>
						<p className="text-sm">
							Unless explicitly stated in writing, <strong className="text-foreground capitalize">{PROJ_NAME}</strong> acts solely as a technology platform and ticketing/voting intermediary. We are not the creator, organizer, or producer of third-party events listed on the platform and have no control over the quality, safety, legality, or execution of such events.
						</p>
					</section>

					{/* Section 4 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							4. Organizers&apos; Responsibilities &amp; Content Guidelines
						</h2>
						<p>Organizers who publish events or voting categories represent and warrant that:</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li>They hold all requisite rights, licenses, permits, and permissions required to host the event and collect attendee funds or contest votes.</li>
							<li>Event content, imagery, descriptions, and media do not infringe upon any third party&apos;s intellectual property, publicity, or privacy rights.</li>
							<li>Events will not promote illegal acts, hate speech, violence, or prohibited commercial schemes.</li>
							<li>Event listings will clearly state ticket prices, venue information, dates, entry rules, and refund conditions.</li>
						</ul>
					</section>

					{/* Section 5 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							5. Ticketing, Purchases &amp; Refunds
						</h2>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li><strong className="text-foreground">Ticket Issuance:</strong> Upon successful payment confirmation via our authorized payment gateways (e.g., Paystack), tickets and digital verification QR codes are delivered electronically to the email address or phone number supplied at checkout.</li>
							<li><strong className="text-foreground">Refunds &amp; Cancellations:</strong> Because events are managed by third-party organizers, refund policies are established by each individual organizer. In the event of a cancellation, postponement, or material change to an event, attendees must seek refunds directly from the organizer, unless mandatory consumer protection regulations apply.</li>
							<li><strong className="text-foreground">Fraudulent Purchases:</strong> We reserve the right to cancel or void any ticket suspected of being obtained through fraudulent payment methods, unauthorized chargebacks, or bot activity.</li>
						</ul>
					</section>

					{/* Section 6 */}
					<section className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-5 sm:p-6">
						<div className="flex items-center gap-2 text-foreground font-semibold text-base sm:text-lg">
							<ShieldCheck className="size-4 text-primary" />
							<h2>6. Contests, Nominees &amp; Voting Integrity</h2>
						</div>
						<p className="text-sm">
							To guarantee fairness and participant protection in awards, pageants, and competitions hosted on <span className="capitalize">{PROJ_NAME}</span>:
						</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li><strong className="text-foreground">Confirmation Code Protection:</strong> Every nominee is issued a confidential Confirmation Code upon enrollment. Organizers cannot unilaterally delete nominees or alter identity-critical attributes once voting commences without verified consent through the nominee&apos;s confirmation token.</li>
							<li><strong className="text-foreground">Paid Nominee Status:</strong> Paid nominees who have satisfied registration fees cannot be removed to protect contestant rights and investment.</li>
							<li><strong className="text-foreground">Vote Finality:</strong> All votes cast via web or USSD telecommunication channels are final and non-refundable. Vote counts recorded in our verified ledger represent definitive contest tallies. Automated bot voting, network spoofing, and unauthorized chargeback abuse are strictly prohibited and grounds for vote disqualification.</li>
						</ul>
					</section>

					{/* Section 7 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							7. Payments, Fees &amp; Payouts
						</h2>
						<p className="text-sm">
							All transactions processed on the platform are handled securely through PCI-DSS compliant third-party payment gateways (e.g., Paystack, mobile network operators).
						</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li><strong className="text-foreground">Platform Fees:</strong> <span className="capitalize">{PROJ_NAME}</span> charges a nominal platform processing fee per ticket sold or paid vote cast, as agreed during event creation or published in our pricing schedule.</li>
							<li><strong className="text-foreground">Merchant Payouts:</strong> Net event proceeds are disbursed to the verified bank account or mobile money wallet specified by the event organizer in accordance with scheduled payout settlement periods.</li>
							<li><strong className="text-foreground">Withholding for Disputes:</strong> We reserve the right to withhold payouts in the event of unresolved chargebacks, fraud investigations, or material event cancellation disputes.</li>
						</ul>
					</section>

					{/* Section 8 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							8. Prohibited Conduct
						</h2>
						<p className="text-sm">You agree not to engage in any of the following prohibited behaviors:</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li>Using the platform for any unlawful purpose or in violation of local, national, or international regulations.</li>
							<li>Attempting to reverse engineer, decompile, scrape, or extract source code from any portion of the platform.</li>
							<li>Interfering with or disrupting platform servers, networks, or telecommunication USSD gateways.</li>
							<li>Impersonating another person, organizer, nominee, or corporate entity.</li>
							<li>Circumventing security features, confirmation protocols, or rate limiters.</li>
						</ul>
					</section>

					{/* Section 9 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							9. Disclaimers &amp; Limitation of Liability
						</h2>
						<p className="text-sm">
							THE PLATFORM AND SERVICES ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, <span className="capitalize">{PROJ_NAME}</span> DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
						</p>
						<p className="text-sm">
							IN NO EVENT SHALL <span className="capitalize">{PROJ_NAME}</span>, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, EVENT CANCELLATIONS, TELECOMMUNICATION DOWNTIME, OR ACTIONS OF EVENT ORGANIZERS.
						</p>
					</section>

					{/* Section 10 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							10. Termination
						</h2>
						<p className="text-sm">
							We reserve the right to suspend or terminate your account and access to the platform at our sole discretion, without prior notice, for conduct that we believe violates these Terms, harms other users or organizers, or exposes the platform to legal liability.
						</p>
					</section>

					{/* Section 11 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							11. Governing Law &amp; Jurisdiction
						</h2>
						<p className="text-sm">
							These Terms shall be governed by and construed in accordance with the laws of the applicable operating jurisdiction, without giving effect to any principles of conflicts of law. Any legal suit, action, or proceeding arising out of or related to these Terms shall be instituted exclusively in the competent courts of that jurisdiction.
						</p>
					</section>

					{/* Section 12 */}
					<section className="space-y-3 pt-2 border-t border-border">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
							<Mail className="size-4 text-primary" />
							12. Contact Information
						</h2>
						<p className="text-sm">
							If you have questions, inquiries, or notices regarding these Terms of Service, please reach out to our legal department:
						</p>
						<div className="rounded-lg border border-border p-4 text-sm space-y-1 bg-muted/20">
							<p className="font-semibold text-foreground capitalize">{PROJ_NAME} Legal &amp; Governance</p>
							<p>Email: <a href="mailto:legal@fextiva.com" className="text-primary hover:underline">legal@fextiva.com</a></p>
							<p>Website: <a href="https://www.fextiva.com" className="text-primary hover:underline">https://www.fextiva.com</a></p>
						</div>
					</section>
				</div>
			</main>

			<LandingFooter />
		</div>
	);
}
