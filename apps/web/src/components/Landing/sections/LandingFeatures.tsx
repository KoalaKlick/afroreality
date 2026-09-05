"use client";

import { Section } from "../Section";
import { getUssdRootDialCode } from "@/lib/utils/ussd";

// ── Minimal Custom SVG Watermarks (Theme-adaptive, ultra-light line art) ──

function BrandWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			<rect x="20" y="24" width="120" height="96" rx="4" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 6" />
			<rect x="34" y="38" width="40" height="32" rx="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
			<circle cx="108" cy="54" r="16" stroke="currentColor" strokeWidth="2.5" />
			<circle cx="108" cy="54" r="6" fill="currentColor" />
			<line x1="34" y1="84" x2="126" y2="84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
			<line x1="34" y1="98" x2="90" y2="98" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
			<path d="M120 100 L136 136 L108 126 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
		</svg>
	);
}

function ReachWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			<path d="M30 60 L65 45 L65 115 L30 100 Z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.15" />
			<path d="M65 52 L105 32 L105 128 L65 108 Z" stroke="currentColor" strokeWidth="2.5" />
			<rect x="22" y="70" width="8" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" />
			<path d="M48 108 L48 132 L36 132" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
			{/* Broadcast Waves */}
			<path d="M120 60 A 24 24 0 0 1 120 100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
			<path d="M134 46 A 44 44 0 0 1 134 114" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
			<path d="M148 32 A 64 64 0 0 1 148 128" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

function TicketWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			<path
				d="M24 40 C24 40, 54 40, 54 40 C54 50, 62 58, 72 58 C82 58, 90 50, 90 40 L136 40 L136 120 L90 120 C90 110, 82 102, 72 102 C62 102, 54 110, 54 120 L24 120 Z"
				stroke="currentColor"
				strokeWidth="2.5"
			/>
			{/* Perforation line */}
			<line x1="72" y1="58" x2="72" y2="102" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
			{/* QR preview */}
			<rect x="36" y="60" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
			<rect x="42" y="66" width="12" height="12" fill="currentColor" />
			{/* Ticket details */}
			<line x1="88" y1="64" x2="124" y2="64" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
			<line x1="88" y1="76" x2="116" y2="76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<line x1="88" y1="88" x2="120" y2="88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	);
}

function SettlementWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			{/* Phone */}
			<rect x="24" y="32" width="56" height="96" rx="8" stroke="currentColor" strokeWidth="2.5" />
			<line x1="42" y1="40" x2="62" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="52" cy="116" r="4" stroke="currentColor" strokeWidth="1.5" />
			{/* MoMo payment badge */}
			<rect x="32" y="52" width="40" height="48" rx="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
			<path d="M42 76 L52 66 L62 76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			<line x1="52" y1="66" x2="52" y2="86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			{/* Card behind */}
			<rect x="68" y="54" width="72" height="48" rx="6" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.1" />
			<line x1="68" y1="68" x2="140" y2="68" stroke="currentColor" strokeWidth="3" />
			<rect x="76" y="80" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
		</svg>
	);
}

function VotingWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			{/* Ballot box */}
			<path d="M30 70 L130 70 L120 134 L40 134 Z" stroke="currentColor" strokeWidth="2.5" />
			<line x1="20" y1="70" x2="140" y2="70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
			<rect x="62" y="66" width="36" height="8" rx="2" fill="currentColor" />
			{/* Ballot paper sliding in */}
			<rect x="52" y="24" width="56" height="52" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" />
			<circle cx="66" cy="40" r="5" stroke="currentColor" strokeWidth="1.5" />
			<path d="M63 40 L65 43 L70 37" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			<line x1="76" y1="40" x2="96" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<circle cx="66" cy="54" r="5" stroke="currentColor" strokeWidth="1.5" />
			<line x1="76" y1="54" x2="96" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	);
}

function GateCrewWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			{/* Shield Base */}
			<path
				d="M80 24 L130 42 C130 84, 108 120, 80 136 C52 120, 30 84, 30 42 Z"
				stroke="currentColor"
				strokeWidth="2.5"
				fill="currentColor"
				fillOpacity="0.1"
			/>
			{/* Scan crosshair / beam */}
			<circle cx="80" cy="74" r="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
			<path d="M66 74 L94 74" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<path d="M80 60 L80 88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<path d="M72 74 L78 80 L88 68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function AnalyticsWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			{/* Axis */}
			<line x1="26" y1="130" x2="136" y2="130" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
			<line x1="26" y1="30" x2="26" y2="130" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
			{/* Trend bars */}
			<rect x="36" y="90" width="16" height="40" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
			<rect x="60" y="70" width="16" height="60" rx="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
			<rect x="84" y="48" width="16" height="82" rx="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
			<rect x="108" y="32" width="16" height="98" rx="2" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
			{/* Ascending Trend Line */}
			<path d="M38 96 L68 72 L92 50 L116 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
			<circle cx="116" cy="30" r="4" fill="currentColor" />
		</svg>
	);
}

function ScaleWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			{/* Server Stack / Infrastructure */}
			<rect x="28" y="32" width="104" height="26" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.1" />
			<circle cx="42" cy="45" r="3" fill="currentColor" />
			<circle cx="54" cy="45" r="3" fill="currentColor" />
			<line x1="72" y1="45" x2="118" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

			<rect x="28" y="68" width="104" height="26" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.1" />
			<circle cx="42" cy="81" r="3" fill="currentColor" />
			<circle cx="54" cy="81" r="3" fill="currentColor" />
			<line x1="72" y1="81" x2="118" y2="81" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

			<rect x="28" y="104" width="104" height="26" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.1" />
			<circle cx="42" cy="117" r="3" fill="currentColor" />
			<circle cx="54" cy="117" r="3" fill="currentColor" />
			<line x1="72" y1="117" x2="118" y2="117" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

			{/* Uptime pulse pulse lines */}
			<path d="M136 45 L144 45 L148 38 L152 52 L156 45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function LandingFeatures() {
	const ussdCode = getUssdRootDialCode();

	const features = [
		{
			num: "01",
			title: "Your Brand, Front & Center",
			description:
				"Your colors, your logo, your identity. Make every event page and ticket look completely yours.",
			Watermark: BrandWatermark,
		},
		{
			num: "02",
			title: "Free Events & Brand Reach",
			description:
				"Host free community events, product launches, and club nights to build authentic audience trust.",
			Watermark: ReachWatermark,
		},
		{
			num: "03",
			title: "Instant QR Ticketing",
			description:
				"Sell tickets in seconds with automated QR codes, VIP tiers, and multi-currency support.",
			Watermark: TicketWatermark,
		},
		{
			num: "04",
			title: "MoMo & Card Settlements",
			description:
				"Direct payouts via MTN MoMo, Telecel, AT Money, M-Pesa, and cards with instant settlements.",
			Watermark: SettlementWatermark,
		},
		{
			num: "05",
			title: `Online & USSD Voting (${ussdCode})`,
			description:
				`Run trusted awards and pageants. Audience votes online or dials ${ussdCode} offline with zero friction.`,
			Watermark: VotingWatermark,
		},
		{
			num: "06",
			title: "Gate Crew & Anti-Fraud",
			description:
				"Equip your door crew with high-speed scanner roles to eliminate ticket fraud on entry.",
			Watermark: GateCrewWatermark,
		},
		{
			num: "07",
			title: "Live Analytics",
			description:
				"Track sales velocity, voter leaderboards, and attendee traffic in real time.",
			Watermark: AnalyticsWatermark,
		},
		{
			num: "08",
			title: "Stadium-Grade Scale",
			description:
				"Battle-tested infrastructure with 99.9% uptime designed for massive African crowds.",
			Watermark: ScaleWatermark,
		},
	];

	return (
		<Section id="features" class="mt-20 md:mt-24" content-class="space-y-12">
			{/* Section Header */}
			<div className="mx-auto text-center space-y-3 max-w-2xl">
				<h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-millik">
					Everything You Need to{" "}
					<span className="text-primary">
						Succeed in Africa
					</span>
				</h2>

				<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
					Tailor-made infrastructure designed specifically for the unique dynamics of African events, payments, and audiences.
				</p>
			</div>

			{/* Confident, Zero-Gap, Zero-Roundness Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border bg-border">
				{features.map((feature) => {
					const Watermark = feature.Watermark;
					return (
						<div
							key={feature.title}
							className="group relative bg-card p-6 sm:p-7 md:p-8 flex flex-col justify-between overflow-hidden transition-colors duration-200 hover:bg-muted/30 border-[0.5px] border-border"
						>
							{/* Subtle Background SVG Watermark */}
							<div
								className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 size-32 sm:size-36 pointer-events-none opacity-[0.07] dark:opacity-[0.09] text-foreground transition-all duration-300 group-hover:opacity-[0.16] dark:group-hover:opacity-[0.20] group-hover:text-primary group-hover:scale-105"
								aria-hidden="true"
							>
								<Watermark />
							</div>

							{/* Card Content */}
							<div className="relative z-10 space-y-4">
								{/* Number Tag */}
								<span className="inline-block text-[11px] font-bold tracking-widest font-mono text-muted-foreground/60 uppercase">
									{feature.num}
								</span>

								{/* Title & Description */}
								<div className="space-y-2">
									<h3 className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight">
										{feature.title}
									</h3>
									<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
										{feature.description}
									</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</Section>
	);
}
