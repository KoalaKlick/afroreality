"use client";

import { Section } from "../Section";
import { getUssdRootDialCode } from "@/lib/utils/ussd";

// ── Solid Silhouette SVG Watermarks (Theme-adaptive, filled vector stamp aesthetic) ──

function BrandWatermark() {
	return (
		<svg
			viewBox="0 0 160 160"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className="size-full"
			aria-hidden="true"
		>
			{/* Solid browser window / brand canvas */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M18 24C18 19.5817 21.5817 16 26 16H134C138.418 16 142 19.5817 142 24V136C142 140.418 138.418 144 134 144H26C21.5817 144 18 140.418 18 136V24ZM28 42H132V134H28V42ZM36 29C36 30.6569 34.6569 32 33 32C31.3431 32 30 30.6569 30 29C30 27.3431 31.3431 26 33 26C34.6569 26 36 27.3431 36 29ZM44 32C45.6569 32 47 30.6569 47 29C47 27.3431 45.6569 26 44 26C42.3431 26 41 27.3431 41 29C41 30.6569 42.3431 32 44 32ZM58 29C58 30.6569 56.6569 32 55 32C53.3431 32 52 30.6569 52 29C52 27.3431 53.3431 26 55 26C56.6569 26 58 27.3431 58 29Z"
				fill="currentColor"
			/>
			{/* Solid Brand Avatar / Logo badge */}
			<rect x="38" y="52" width="36" height="36" rx="18" fill="currentColor" />
			{/* Solid typography hierarchy bars */}
			<rect x="82" y="54" width="42" height="10" rx="5" fill="currentColor" />
			<rect x="82" y="70" width="28" height="8" rx="4" fill="currentColor" fillOpacity="0.6" />
			{/* Solid brand color swatches */}
			<rect x="38" y="100" width="24" height="20" rx="5" fill="currentColor" />
			<rect x="68" y="100" width="24" height="20" rx="5" fill="currentColor" fillOpacity="0.7" />
			<rect x="98" y="100" width="24" height="20" rx="5" fill="currentColor" fillOpacity="0.4" />
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
			{/* Solid Megaphone Body */}
			<path
				d="M20 62C20 58.6863 22.6863 56 26 56H48L92 26C95.5 23.5 100 26 100 30.5V129.5C100 134 95.5 136.5 92 134L48 104H26C22.6863 104 20 101.314 20 98V62Z"
				fill="currentColor"
			/>
			{/* Solid Handle */}
			<path
				d="M38 104H52V128C52 133.523 47.5228 138 42 138C36.4772 138 32 133.523 32 128V110L38 104Z"
				fill="currentColor"
			/>
			{/* Solid Concentric Sound Beams */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M112 50C114.761 50 117 52.2386 117 55C125.837 61.6274 131 70.817 131 80C131 89.183 125.837 98.3726 117 105C114.761 106.709 111.603 106.261 109.895 104.021C108.186 101.78 108.634 98.6225 110.874 96.9142C117.163 92.1274 121 86.183 121 80C121 73.817 117.163 67.8726 110.874 63.0858C108.634 61.3775 108.186 58.2198 109.895 55.9792C110.375 55.3496 111.161 50 112 50Z"
				fill="currentColor"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M128 32C130.761 32 133 34.2386 133 37C146.5 48 154 63.5 154 80C154 96.5 146.5 112 133 123C130.761 124.709 127.603 124.261 125.895 122.021C124.186 119.78 124.634 116.623 126.874 114.914C137.5 106 144 93.5 144 80C144 66.5 137.5 54 126.874 45.0858C124.634 43.3775 124.186 40.2198 125.895 37.9792C126.375 37.3496 127.161 32 128 32Z"
				fill="currentColor"
				fillOpacity="0.7"
			/>
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
			{/* Solid Ticket with side notches and inner cutouts */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M20 36C20 29.3726 25.3726 24 32 24H128C134.627 24 140 29.3726 140 36V66C131.163 66 124 72.268 124 80C124 87.732 131.163 94 140 94V124C140 130.627 134.627 136 128 136H32C25.3726 136 20 130.627 20 124V94C28.8366 94 36 87.732 36 80C36 72.268 28.8366 66 20 66V36Z"
				fill="currentColor"
			/>
			{/* Perforation line (cutout dots) */}
			<circle cx="88" cy="36" r="3" fill="var(--color-background, #fff)" />
			<circle cx="88" cy="48" r="3" fill="var(--color-background, #fff)" />
			<circle cx="88" cy="60" r="3" fill="var(--color-background, #fff)" />
			<circle cx="88" cy="72" r="3" fill="var(--color-background, #fff)" />
			<circle cx="88" cy="88" r="3" fill="var(--color-background, #fff)" />
			<circle cx="88" cy="100" r="3" fill="var(--color-background, #fff)" />
			<circle cx="88" cy="112" r="3" fill="var(--color-background, #fff)" />
			<circle cx="88" cy="124" r="3" fill="var(--color-background, #fff)" />
			{/* Solid QR Code silhouette on left stub */}
			<rect x="36" y="48" width="36" height="36" rx="6" fill="var(--color-background, #fff)" />
			<rect x="42" y="54" width="10" height="10" rx="2" fill="currentColor" />
			<rect x="56" y="54" width="10" height="10" rx="2" fill="currentColor" />
			<rect x="42" y="68" width="10" height="10" rx="2" fill="currentColor" />
			<rect x="58" y="70" width="6" height="6" fill="currentColor" />
			{/* Ticket stub content blocks */}
			<rect x="36" y="96" width="36" height="8" rx="4" fill="var(--color-background, #fff)" fillOpacity="0.8" />
			<rect x="36" y="110" width="24" height="6" rx="3" fill="var(--color-background, #fff)" fillOpacity="0.6" />
			{/* Right Stub Details */}
			<rect x="100" y="48" width="28" height="10" rx="5" fill="var(--color-background, #fff)" />
			<rect x="100" y="66" width="22" height="8" rx="4" fill="var(--color-background, #fff)" fillOpacity="0.8" />
			<rect x="100" y="82" width="26" height="8" rx="4" fill="var(--color-background, #fff)" fillOpacity="0.8" />
			<rect x="100" y="104" width="28" height="14" rx="4" fill="var(--color-background, #fff)" />
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
			{/* Solid Phone Body */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M20 28C20 20.268 26.268 14 34 14H78C85.732 14 92 20.268 92 28V132C92 139.732 85.732 146 78 146H34C26.268 146 20 139.732 20 132V28ZM28 32C28 29.7909 29.7909 28 32 28H80C82.2091 28 84 29.7909 84 32V124C84 126.209 82.2091 128 80 128H32C29.7909 128 28 126.209 28 124V32ZM56 138C58.2091 138 60 136.209 60 134C60 131.791 58.2091 130 56 130C53.7909 130 52 131.791 52 134C52 136.209 53.7909 138 56 138Z"
				fill="currentColor"
			/>
			{/* Mobile transfer arrow bubble */}
			<rect x="36" y="44" width="40" height="40" rx="8" fill="currentColor" />
			<path
				d="M48 64L56 56M56 56L64 64M56 56V72"
				stroke="var(--color-background, #fff)"
				strokeWidth="3.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<rect x="36" y="94" width="40" height="8" rx="4" fill="currentColor" fillOpacity="0.7" />
			<rect x="36" y="108" width="26" height="6" rx="3" fill="currentColor" fillOpacity="0.4" />
			{/* Solid Card Stacking Behind */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M84 46C84 40.4772 88.4772 36 94 36H138C143.523 36 148 40.4772 148 46V102C148 107.523 143.523 112 138 112H94C88.4772 112 84 107.523 84 102V46ZM84 56H148V68H84V56ZM96 82C93.7909 82 92 83.7909 92 86V92C92 94.2091 93.7909 96 96 96H108C110.209 96 112 94.2091 112 92V86C112 83.7909 110.209 82 108 82H96Z"
				fill="currentColor"
				fillOpacity="0.85"
			/>
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
			{/* Solid Ballot Box */}
			<path
				d="M24 72H136L124 138C123 142.418 119.418 146 115 146H45C40.5817 146 37 142.418 36 138L24 72Z"
				fill="currentColor"
			/>
			{/* Ballot box lid with slot */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M18 62C18 57.5817 21.5817 54 26 54H134C138.418 54 142 57.5817 142 62V68C142 72.4183 138.418 76 134 76H26C21.5817 76 18 72.4183 18 68V62ZM56 62C56 60.3431 57.3431 59 59 59H101C102.657 59 104 60.3431 104 62C104 63.6569 102.657 65 101 65H59C57.3431 65 56 63.6569 56 62Z"
				fill="currentColor"
			/>
			{/* Solid Ballot Paper Sliding Into Box */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M48 18C48 13.5817 51.5817 10 56 10H104C108.418 10 112 13.5817 112 18V56H48V18ZM62 26C62 29.3137 59.3137 32 56 32C52.6863 32 50 29.3137 50 26C50 22.6863 52.6863 20 56 20C59.3137 20 62 22.6863 62 26ZM70 24H98V28H70V24ZM62 42C62 45.3137 59.3137 48 56 48C52.6863 48 50 45.3137 50 42C50 38.6863 52.6863 36 56 36C59.3137 36 62 38.6863 62 42ZM70 40H94V44H70V40Z"
				fill="currentColor"
				fillOpacity="0.9"
			/>
			{/* Checkmark inside ballot top circle */}
			<circle cx="56" cy="26" r="6" fill="currentColor" />
			<path
				d="M53 26L55 28L59 24"
				stroke="var(--color-background, #fff)"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
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
			{/* Solid Outer Shield */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M80 14L138 38V82C138 116.5 113.5 142.5 80 152C46.5 142.5 22 116.5 22 82V38L80 14ZM80 28L126 47V82C126 110.5 106.5 131.5 80 139C53.5 131.5 34 110.5 34 82V47L80 28Z"
				fill="currentColor"
			/>
			{/* Solid Inner Crest / Badge */}
			<path
				d="M80 38L116 54V82C116 104.5 100.5 121 80 127C59.5 121 44 104.5 44 82V54L80 38Z"
				fill="currentColor"
			/>
			{/* Solid Verified Checkmark in Negative Space */}
			<path
				d="M65 82L75 92L95 72"
				stroke="var(--color-background, #fff)"
				strokeWidth="7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
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
			{/* Solid Ascending Bar Chart Columns */}
			<rect x="20" y="104" width="22" height="38" rx="6" fill="currentColor" fillOpacity="0.4" />
			<rect x="50" y="80" width="22" height="62" rx="6" fill="currentColor" fillOpacity="0.6" />
			<rect x="80" y="56" width="22" height="86" rx="6" fill="currentColor" fillOpacity="0.8" />
			<rect x="110" y="32" width="22" height="110" rx="6" fill="currentColor" />

			{/* Solid Ascending Growth Ribbon / Trend Indicator */}
			<path
				d="M24 92C48 76 74 56 114 26L110 20L138 20L134 48L126 40C88 68 62 88 32 104L24 92Z"
				fill="currentColor"
			/>
			{/* Baseline Ground */}
			<rect x="14" y="142" width="132" height="6" rx="3" fill="currentColor" />
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
			{/* Solid Server Rack Unit 1 */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M22 26C22 20.4772 26.4772 16 32 16H128C133.523 16 138 20.4772 138 26V46C138 51.5228 133.523 56 128 56H32C26.4772 56 22 51.5228 22 46V26ZM38 36C38 38.2091 36.2091 40 34 40C31.7909 40 30 38.2091 30 36C30 33.7909 31.7909 32 34 32C36.2091 32 38 33.7909 38 36ZM48 40C50.2091 40 52 38.2091 52 36C52 33.7909 50.2091 32 48 32C45.7909 32 44 33.7909 44 36C44 38.2091 45.7909 40 48 40ZM64 32H126V40H64V32Z"
				fill="currentColor"
			/>
			{/* Solid Server Rack Unit 2 */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M22 64C22 58.4772 26.4772 54 32 54H128C133.523 54 138 58.4772 138 64V84C138 89.5228 133.523 94 128 94H32C26.4772 94 22 89.5228 22 84V64ZM38 74C38 76.2091 36.2091 78 34 78C31.7909 78 30 76.2091 30 74C30 71.7909 31.7909 70 34 70C36.2091 70 38 71.7909 38 74ZM48 78C50.2091 78 52 76.2091 52 74C52 71.7909 50.2091 70 48 70C45.7909 70 44 71.7909 44 74C44 76.2091 45.7909 78 48 78ZM64 70H126V78H64V70Z"
				fill="currentColor"
				fillOpacity="0.9"
			/>
			{/* Solid Server Rack Unit 3 */}
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M22 102C22 96.4772 26.4772 92 32 92H128C133.523 92 138 96.4772 138 102V122C138 127.523 133.523 132 128 132H32C26.4772 132 22 127.523 22 122V102ZM38 112C38 114.209 36.2091 116 34 116C31.7909 116 30 114.209 30 112C30 109.791 31.7909 108 34 108C36.2091 108 38 109.791 38 112ZM48 116C50.2091 116 52 114.209 52 112C52 109.791 50.2091 108 48 108C45.7909 108 44 109.791 44 112C44 114.209 45.7909 116 48 116ZM64 108H126V116H64V108Z"
				fill="currentColor"
				fillOpacity="0.8"
			/>
			{/* High-voltage solid lightning bolt overlay */}
			<path
				d="M142 66L118 96H132L120 126L152 84H134L142 66Z"
				fill="currentColor"
			/>
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
							{/* Subtle Solid Silhouette Background SVG Watermark */}
							<div
								className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 size-32 sm:size-36 pointer-events-none opacity-[0.06] dark:opacity-[0.08] text-foreground transition-all duration-300 group-hover:opacity-[0.14] dark:group-hover:opacity-[0.18] group-hover:text-primary group-hover:scale-105"
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
