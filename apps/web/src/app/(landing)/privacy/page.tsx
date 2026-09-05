import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, FileText, Mail } from "lucide-react";
import { PROJ_NAME } from "@/lib/constants/branding";
import { LandingFooter } from "@/components/Landing/LandingFooter";

export const metadata: Metadata = {
	title: `Privacy Policy | ${PROJ_NAME}`,
	description: `Learn how ${PROJ_NAME} collects, uses, and protects your personal information when using our event ticketing, voting, and organizer platform.`,
};

export default function PrivacyPolicyPage() {
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
						<Shield className="size-4 text-primary" />
						<span>Legal &amp; Compliance</span>
					</div>
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
						Privacy Policy
					</h1>
					<div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
						<span>Effective date: {effectiveDate}</span>
						<span>•</span>
						<span>Last updated: {lastUpdated}</span>
					</div>
					<p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
						This Privacy Policy explains how <strong className="text-foreground capitalize">{PROJ_NAME}</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, discloses, and protects your information when you visit our website, register for an account, purchase tickets, vote in contests, or interact with our platform and related services.
					</p>
				</header>

				{/* Content Body */}
				<div className="space-y-10 text-sm sm:text-base text-muted-foreground leading-relaxed">
					{/* Section 1 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							1. Information We Collect
						</h2>
						<p>
							We collect information that you provide directly to us, as well as information generated automatically when you access or use our services.
						</p>
						<div className="space-y-2.5 pl-1">
							<p className="font-medium text-foreground text-sm">A. Information You Provide Directly:</p>
							<ul className="list-disc pl-5 space-y-1.5 text-sm">
								<li><strong className="text-foreground">Account Information:</strong> Name, email address, username, password, phone number, and profile picture when creating an organizer or attendee account.</li>
								<li><strong className="text-foreground">Event &amp; Nominee Information:</strong> Details regarding events, categories, nominee submissions, bios, contact email addresses, and event media uploaded by organizers or public nominees.</li>
								<li><strong className="text-foreground">Transaction &amp; Ticketing Data:</strong> Attendee name, recipient email, phone number, ticket type, purchase quantity, and transaction references. Payment card details and mobile money pins are handled directly by PCI-DSS certified payment partners (such as Paystack) and are never stored on our servers.</li>
								<li><strong className="text-foreground">Communications:</strong> Information submitted when you contact customer support, report an issue, or respond to confirmation requests.</li>
							</ul>

							<p className="font-medium text-foreground text-sm pt-2">B. Information Collected Automatically:</p>
							<ul className="list-disc pl-5 space-y-1.5 text-sm">
								<li><strong className="text-foreground">Log &amp; Device Information:</strong> IP address, browser type, operating system, referral URLs, device identifiers, and timestamp data.</li>
								<li><strong className="text-foreground">Voting &amp; USSD Records:</strong> Voting timestamps, selected nominee identifiers, and telecom operator reference logs used exclusively to verify vote validity and prevent duplicate ballot manipulation.</li>
							</ul>
						</div>
					</section>

					{/* Section 2 - Google OAuth compliance */}
					<section className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-5 sm:p-6">
						<div className="flex items-center gap-2 text-foreground font-semibold text-base sm:text-lg">
							<Lock className="size-4 text-primary" />
							<h2>2. Google API Services &amp; OAuth User Data Policy</h2>
						</div>
						<p className="text-sm">
							If you choose to register or authenticate using Google Sign-In, we request access only to your basic profile information (<code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">openid</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">email</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">profile</code>).
						</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li><strong className="text-foreground">Purpose of Use:</strong> We access your Google user ID, verified email address, full name, and avatar image strictly to create and authenticate your account on our platform.</li>
							<li><strong className="text-foreground">No Advertising or Surveillance:</strong> We do not sell your Google user data, share it with data brokers, or use it for personalized advertising.</li>
							<li><strong className="text-foreground">Limited Use Requirements:</strong> <span className="capitalize">{PROJ_NAME}</span>&apos;s use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Google API Services User Data Policy</a>, including the Limited Use requirements.</li>
						</ul>
					</section>

					{/* Section 3 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							3. How We Use Your Information
						</h2>
						<p>We use the collected information for the following legitimate purposes:</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li>To provision, maintain, and optimize our event management, ticketing, and voting services.</li>
							<li>To authenticate user identity and prevent unauthorized access.</li>
							<li>To send transactional messages, including ticket delivery, voting confirmations, OTP change requests, and receipts.</li>
							<li>To facilitate nominee verification and ensure contest integrity through secure confirmation codes.</li>
							<li>To detect, investigate, and prevent fraudulent transactions, spam, and platform abuse.</li>
							<li>To comply with applicable legal and financial compliance obligations.</li>
						</ul>
					</section>

					{/* Section 4 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							4. How We Share Your Information
						</h2>
						<p>
							We respect your privacy and do not sell your personal data. We only share information in the following limited circumstances:
						</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li><strong className="text-foreground">Event Organizers:</strong> When you register for an event or purchase a ticket, the event organizer receives attendee details (e.g., ticket holder name, email, check-in status) required for event administration.</li>
							<li><strong className="text-foreground">Service Providers:</strong> Trusted third-party vendors who assist us in operating our platform, including cloud hosting, email delivery (e.g., Brevo/Gmail), telecom USSD gateways, and payment processing (e.g., Paystack). All service providers are bound by strict confidentiality and data protection obligations.</li>
							<li><strong className="text-foreground">Legal &amp; Safety Compliance:</strong> When required by law, subpoena, or in good faith belief that disclosure is reasonably necessary to protect the rights, property, or safety of users or the public.</li>
						</ul>
					</section>

					{/* Section 5 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							5. Data Security &amp; Retention
						</h2>
						<p className="text-sm">
							We implement industry-standard administrative, technical, and physical safeguards designed to protect personal data against accidental loss, unauthorized access, alteration, and disclosure. Sensitive tokens, passwords, and sessions are encrypted using secure cryptographic standards (such as bcrypt and JWTs).
						</p>
						<p className="text-sm">
							We retain your information only for as long as necessary to fulfill the purposes outlined in this policy, maintain accurate financial records, resolve disputes, and enforce our agreements.
						</p>
					</section>

					{/* Section 6 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							6. Your Rights &amp; Choices
						</h2>
						<p className="text-sm">Depending on your jurisdiction, you have specific rights regarding your personal information:</p>
						<ul className="list-disc pl-5 space-y-1.5 text-sm">
							<li><strong className="text-foreground">Access &amp; Correction:</strong> You may review and update your account details directly from your profile settings.</li>
							<li><strong className="text-foreground">Nominee Approvals:</strong> Nominees retain control over public profiles via their private Confirmation Code, requiring consent before edits or deletions take effect.</li>
							<li><strong className="text-foreground">Account Deletion:</strong> You may request the deletion of your account and associated personal data by contacting our support team.</li>
							<li><strong className="text-foreground">Opt-Out:</strong> You may opt out of non-essential marketing emails by using the unsubscribe link included in such messages.</li>
						</ul>
					</section>

					{/* Section 7 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							7. Cookies &amp; Tracking
						</h2>
						<p className="text-sm">
							We use essential cookies and session storage necessary to keep you securely signed in, remember your preferences, and process transactions. We do not use intrusive third-party cross-site tracking cookies.
						</p>
					</section>

					{/* Section 8 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							8. Children&apos;s Privacy
						</h2>
						<p className="text-sm">
							Our services are not directed to individuals under the age of 13 (or under 16 in certain jurisdictions). We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take immediate steps to delete such data.
						</p>
					</section>

					{/* Section 9 */}
					<section className="space-y-3">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
							9. Updates to this Policy
						</h2>
						<p className="text-sm">
							We may update this Privacy Policy periodically to reflect changes in our legal obligations, platform features, or operational practices. The updated version will be indicated by an updated &ldquo;Last updated&rdquo; date at the top of this page.
						</p>
					</section>

					{/* Section 10 */}
					<section className="space-y-3 pt-2 border-t border-border">
						<h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
							<Mail className="size-4 text-primary" />
							10. Contact Us
						</h2>
						<p className="text-sm">
							If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact us at:
						</p>
						<div className="rounded-lg border border-border p-4 text-sm space-y-1 bg-muted/20">
							<p className="font-semibold text-foreground capitalize">{PROJ_NAME} Support &amp; Compliance</p>
							<p>Email: <a href="mailto:support@fextiva.com" className="text-primary hover:underline">support@fextiva.com</a></p>
							<p>Website: <a href="https://www.fextiva.com" className="text-primary hover:underline">https://www.fextiva.com</a></p>
						</div>
					</section>
				</div>
			</main>

			<LandingFooter />
		</div>
	);
}
