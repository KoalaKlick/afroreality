// src/components/organization/management/OrgThemeColors.tsx

"use client";

import { useState } from "react";
import {
	Palette,
	Check,
	Sparkles,
	Building2,
	Users,
	ArrowRight,
	Globe,
	Mail,
	Phone,
	Calendar,
	MapPin,
	Share2,
	Trophy,
	ImageIcon,
	ChevronRight,
	ExternalLink,
	Smartphone,
	CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import { OrgGeometricBanner } from "@/components/common/OrgGeometricBanner";
import { StatusBadge } from "@/components/common/status-badge";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import { cn } from "@/lib/utils";
import { PRESET_COLORS, PRESET_THEMES } from "@/utils/theme/constants";

export interface OrgThemeColorsProps {
	readonly primaryColor: string;
	readonly setPrimaryColor: (value: string) => void;
	readonly secondaryColor: string;
	readonly setSecondaryColor: (value: string) => void;
	readonly tertiaryColor: string;
	readonly setTertiaryColor: (value: string) => void;
	readonly logoUrl: string | null;
	readonly bannerUrl?: string | null;
	readonly orgName: string;
	readonly description?: string | null;
	readonly websiteUrl?: string | null;
	readonly contactEmail?: string | null;
	readonly phone?: string | null;
	readonly socialLinks?: string[];
	readonly slug?: string;
}

function isLightHex(hex: string): boolean {
	const c = hex.replace("#", "");
	if (c.length !== 6) return false;
	const r = parseInt(c.slice(0, 2), 16);
	const g = parseInt(c.slice(2, 4), 16);
	const b = parseInt(c.slice(4, 6), 16);
	return (r * 299 + g * 587 + b * 114) / 1000 > 165;
}

type ColorRole = "primary" | "secondary" | "tertiary";

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function OrgPageSamplePreview({
	primaryColor,
	secondaryColor,
	tertiaryColor,
	logoUrl,
	bannerUrl,
	orgName,
	description,
	websiteUrl,
	contactEmail,
	phone,
	slug,
	socialLinks,
}: {
	readonly primaryColor: string;
	readonly secondaryColor: string;
	readonly tertiaryColor: string;
	readonly logoUrl: string | null;
	readonly bannerUrl?: string | null;
	readonly orgName: string;
	readonly description?: string | null;
	readonly websiteUrl?: string | null;
	readonly contactEmail?: string | null;
	readonly phone?: string | null;
	readonly slug?: string;
	readonly socialLinks?: string[];
}) {
	const logoDisplayUrl = logoUrl ? getOrgImageUrl(logoUrl) : null;
	const bannerDisplayUrl = bannerUrl ? getOrgImageUrl(bannerUrl) : null;
	const displayName = orgName?.trim() || "fextiva Partner Org";
	const orgSlug = slug || "organization";

	// Default preview links if none provided
	const displaySocials =
		socialLinks && socialLinks.filter((s) => s && s.trim() !== "").length > 0
			? socialLinks.filter((s) => s && s.trim() !== "")
			: ["https://x.com", "https://instagram.com", "https://linkedin.com"];

	const cleanWebsite = websiteUrl
		? websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
		: null;

	const brandVars = {
		"--color-brand-primary": primaryColor || "#ca0808",
		"--color-brand-secondary": secondaryColor || "#e88722",
		"--color-brand-tertiary": tertiaryColor || "#53967a",
	} as React.CSSProperties;

	return (
		<div
			className="w-full rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col text-foreground transition-all duration-300"
			style={brandVars}
		>
			{/* Mock Browser Topbar */}
			<div className="sticky top-0 z-20 px-3.5 py-2.5 bg-card/95 backdrop-blur-md border-b flex items-center justify-between text-[11px] text-muted-foreground select-none">
				<div className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-red-400/80" />
					<span className="size-2 rounded-full bg-yellow-400/80" />
					<span className="size-2 rounded-full bg-green-400/80" />
				</div>
				<div className="font-mono px-2.5 py-0.5 rounded-md bg-muted/60 border text-[10px] text-foreground/80 truncate max-w-[200px]">
					fextiva.com/{orgSlug}
				</div>
				<span
					className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
					style={{
						color: primaryColor || "#ca0808",
						backgroundColor: `color-mix(in srgb, ${primaryColor || "#ca0808"} 12%, transparent)`,
					}}
				>
					Live Page
				</span>
			</div>

			{/* Scrollable Viewport mirroring full public OrgProfilePage */}
			<div className="max-h-[640px] overflow-y-auto overscroll-contain select-none">
				{/* 1. HERO SECTION (Mirroring OrgProfileHero) */}
				<div className="relative w-full">
					{/* Full-width Banner */}
					<div className="relative h-32 sm:h-40 w-full overflow-hidden bg-muted/30">
						{bannerDisplayUrl ? (
							<img
								src={bannerDisplayUrl}
								alt={displayName}
								className="w-full h-full object-cover"
							/>
						) : (
							<OrgGeometricBanner
								primaryColor={primaryColor}
								secondaryColor={secondaryColor}
								tertiaryColor={tertiaryColor}
							/>
						)}
					</div>

					{/* Profile Header Overlay */}
					<div className="px-4 pb-4 -mt-8 sm:-mt-10 relative z-10 space-y-3">
						<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
							{/* Left: Logo Avatar & Details */}
							<div className="flex items-end gap-3 min-w-0">
								{/* Logo Box */}
								<div className="size-16 sm:size-20 rounded-2xl bg-card p-1 border-2 border-background shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
									{logoDisplayUrl ? (
										<img
											src={logoDisplayUrl}
											alt={displayName}
											className="w-full h-full object-cover rounded-xl"
										/>
									) : (
										<div
											className="w-full h-full rounded-xl flex items-center justify-center font-bold font-millik text-xl"
											style={{
												backgroundColor: `color-mix(in srgb, ${primaryColor || "#ca0808"} 15%, transparent)`,
												color: primaryColor || "#ca0808",
											}}
										>
											{getInitials(displayName)}
										</div>
									)}
								</div>

								{/* Name & Metadata */}
								<div className="space-y-0.5 min-w-0">
									<h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground truncate font-millik">
										{displayName}
									</h3>
									<div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
										<span className="text-foreground/90 font-semibold">@{orgSlug}</span>
										<span>•</span>
										<div className="flex items-center gap-0.5">
											<Calendar className="size-2.5" style={{ color: primaryColor || "#ca0808" }} />
											<span>2 Events</span>
										</div>
										{contactEmail && (
											<>
												<span>•</span>
												<div className="flex items-center gap-0.5 text-foreground/80">
													<Mail className="size-2.5" style={{ color: primaryColor || "#ca0808" }} />
													<span className="truncate max-w-[90px]">{contactEmail}</span>
												</div>
											</>
										)}
										{phone && (
											<>
												<span>•</span>
												<div className="flex items-center gap-0.5 text-foreground/80">
													<Phone className="size-2.5" style={{ color: primaryColor || "#ca0808" }} />
													<span className="truncate max-w-[80px]">{phone}</span>
												</div>
											</>
										)}
										{cleanWebsite && (
											<>
												<span>•</span>
												<div className="flex items-center gap-0.5 text-foreground/80">
													<Globe className="size-2.5" style={{ color: primaryColor || "#ca0808" }} />
													<span className="truncate max-w-[85px]">{cleanWebsite}</span>
												</div>
											</>
										)}
									</div>
								</div>
							</div>

							{/* Right: Social Media Handles & Action Buttons */}
							<div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0 shrink-0">
								{/* Social Icons */}
								<div className="flex items-center gap-1">
									{displaySocials.slice(0, 3).map((url, i) => {
										const plat = getSocialPlatform(url, "size-3");
										return (
											<div
												key={i}
												className="size-7 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:text-primary transition-colors shadow-none"
												title={plat.name}
											>
												{plat.icon}
											</div>
										);
									})}
								</div>

								{/* Share Mock Button */}
								<div className="h-7 px-2 rounded-lg border border-border bg-card flex items-center gap-1 text-[10px] font-semibold text-muted-foreground select-none">
									<Share2 className="size-2.5" />
									<span>Share</span>
								</div>

								{/* Request to Join Button */}
								<div
									className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 select-none shadow-none"
									style={{ backgroundColor: primaryColor || "#ca0808" }}
								>
									<span>Request to Join</span>
									<ArrowRight className="size-2.5" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* 2. PAN-AFRICAN DIVIDER (Mirroring PanAfricanDivider) */}
				<div className="h-1 w-full flex overflow-hidden shrink-0">
					<div className="flex-1" style={{ backgroundColor: primaryColor || "#ca0808" }} />
					<div className="flex-1" style={{ backgroundColor: secondaryColor || "#e88722" }} />
					<div className="flex-1" style={{ backgroundColor: tertiaryColor || "#53967a" }} />
				</div>

				{/* 3. OUR EVENTS SECTION (Mirroring OrgEventsListSection & EventCard) */}
				<div
					className="p-4 space-y-3 transition-colors"
					style={{
						backgroundColor: `color-mix(in srgb, ${primaryColor || "#ca0808"} 3.5%, transparent)`,
					}}
				>
					<div className="flex items-center justify-between">
						<h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-foreground font-millik">
							Our Events.
						</h4>
						<span
							className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5"
							style={{ color: primaryColor || "#ca0808" }}
						>
							View all
							<ChevronRight className="size-2.5" />
						</span>
					</div>

					{/* Event Cards Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{/* Card 1: Pan-African Cultural Gala & Awards */}
						<div className="rounded-xl border bg-card p-2 flex flex-col justify-between gap-2 shadow-none transition-all hover:border-primary/50">
							{/* Poster Box */}
							<div className="relative w-full aspect-4/3 overflow-hidden rounded-lg bg-muted">
								<img
									src="/landing/a.webp"
									alt="Pan-African Gala"
									className="w-full h-full object-cover"
								/>
								<div className="absolute inset-0 bg-black/10" />

								{/* Top-left Date Badge */}
								<div className="absolute top-1.5 left-1.5 bg-background/95 backdrop-blur-md rounded-md py-0.5 px-1.5 flex flex-col items-center justify-center min-w-[36px] border border-border shadow-none z-10">
									<span className="text-[8px] font-bold uppercase text-muted-foreground leading-none">
										OCT
									</span>
									<span
										className="text-xs font-black leading-tight mt-0.5"
										style={{ color: primaryColor || "#ca0808" }}
									>
										24
									</span>
								</div>

								{/* Top-right USSD Badge */}
								<div className="absolute top-1.5 right-1.5 bg-background/95 backdrop-blur-md rounded-md px-1.5 py-0.5 border border-primary/30 z-10 flex items-center gap-0.5">
									<Smartphone className="size-2" style={{ color: primaryColor || "#ca0808" }} />
									<span
										className="text-[9px] font-bold font-mono tracking-wide"
										style={{ color: primaryColor || "#ca0808" }}
									>
										*920*104#
									</span>
								</div>
							</div>

							{/* Card Details */}
							<div className="space-y-1">
								<div className="flex items-center gap-1">
									<StatusBadge variant="ticketed" size="sm" />
									<StatusBadge variant="upcoming" size="sm" />
								</div>
								<p className="text-xs font-bold text-foreground line-clamp-1 font-millik">
									Pan-African Cultural Gala &amp; Awards
								</p>
								<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
									<MapPin className="size-2.5 shrink-0" style={{ color: primaryColor || "#ca0808" }} />
									<span className="truncate">Accra Convention Centre, Ghana</span>
								</div>
								<div className="flex items-center gap-1 pt-0.5">
									<span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
										CULTURAL
									</span>
									<span className="text-[8px] text-muted-foreground/80 bg-muted/40 px-1 py-0.5 rounded">
										#Gala
									</span>
								</div>
							</div>
						</div>

						{/* Card 2: Afro Tech & Creative Summit */}
						<div className="rounded-xl border bg-card p-2 flex flex-col justify-between gap-2 shadow-none transition-all hover:border-primary/50">
							{/* Poster Box */}
							<div className="relative w-full aspect-4/3 overflow-hidden rounded-lg bg-muted">
								<img
									src="/landing/b.webp"
									alt="Afro Tech Summit"
									className="w-full h-full object-cover"
								/>
								<div className="absolute inset-0 bg-black/10" />

								{/* Top-left Date Badge */}
								<div className="absolute top-1.5 left-1.5 bg-background/95 backdrop-blur-md rounded-md py-0.5 px-1.5 flex flex-col items-center justify-center min-w-[36px] border border-border shadow-none z-10">
									<span className="text-[8px] font-bold uppercase text-muted-foreground leading-none">
										NOV
									</span>
									<span
										className="text-xs font-black leading-tight mt-0.5"
										style={{ color: secondaryColor || "#e88722" }}
									>
										12
									</span>
								</div>

								{/* Top-right USSD Badge */}
								<div className="absolute top-1.5 right-1.5 bg-background/95 backdrop-blur-md rounded-md px-1.5 py-0.5 border border-primary/30 z-10 flex items-center gap-0.5">
									<Smartphone className="size-2" style={{ color: primaryColor || "#ca0808" }} />
									<span
										className="text-[9px] font-bold font-mono tracking-wide"
										style={{ color: primaryColor || "#ca0808" }}
									>
										*920*208#
									</span>
								</div>
							</div>

							{/* Card Details */}
							<div className="space-y-1">
								<div className="flex items-center gap-1">
									<StatusBadge variant="hybrid" size="sm" />
									<StatusBadge variant="upcoming" size="sm" />
								</div>
								<p className="text-xs font-bold text-foreground line-clamp-1 font-millik">
									Afro Tech &amp; Creative Summit
								</p>
								<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
									<MapPin className="size-2.5 shrink-0" style={{ color: primaryColor || "#ca0808" }} />
									<span className="truncate">Eko Hotel &amp; Suites, Lagos</span>
								</div>
								<div className="flex items-center gap-1 pt-0.5">
									<span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
										SUMMIT
									</span>
									<span className="text-[8px] text-muted-foreground/80 bg-muted/40 px-1 py-0.5 rounded">
										#Tech
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* 4. ORG DETAILS FOOTER (Mirroring OrgDetailsFooter) */}
				<div className="p-4 bg-background border-t space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
						{/* Left: About Organization */}
						<div className="sm:col-span-7 space-y-1.5">
							<h4 className="text-xs font-black uppercase tracking-tight text-foreground font-millik">
								About {displayName}.
							</h4>
							<div className="text-[10px] text-muted-foreground leading-relaxed">
								{description?.trim() ? (
									<RichTextDisplay
										content={description}
										className="text-[10px] leading-relaxed [&_p]:my-0.5 text-muted-foreground"
									/>
								) : (
									<p className="italic text-muted-foreground/70">
										Dedicated to delivering exceptional Pan-African events, cultural galas, and community summits powered by fextiva.
									</p>
								)}
							</div>
						</div>

						{/* Right: Partners & External Galleries */}
						<div className="sm:col-span-5 space-y-3">
							{/* Our Partners */}
							<div className="space-y-1.5">
								<h5 className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 font-millik text-foreground">
									<Trophy className="size-3" style={{ color: primaryColor || "#ca0808" }} />
									<span>Our Partners.</span>
								</h5>
								<div className="flex flex-wrap gap-1.5">
									{["Google", "MTN", "fextiva", "Telecel"].map((partner) => (
										<span
											key={partner}
											className="px-2 py-0.5 rounded-md border text-[9px] bg-card font-semibold text-foreground"
										>
											{partner}
										</span>
									))}
								</div>
							</div>

							{/* External Photo Albums */}
							<div className="space-y-1.5 pt-1.5 border-t border-dashed">
								<h5 className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 font-millik text-foreground">
									<ExternalLink className="size-3" style={{ color: primaryColor || "#ca0808" }} />
									<span>External Photo Albums.</span>
								</h5>
								<div className="flex items-center justify-between p-1.5 rounded-lg border bg-card text-[9px] font-medium text-foreground">
									<div className="flex items-center gap-1.5 truncate">
										<div
											className="size-5 rounded flex items-center justify-center shrink-0"
											style={{
												backgroundColor: `color-mix(in srgb, ${primaryColor || "#ca0808"} 15%, transparent)`,
												color: primaryColor || "#ca0808",
											}}
										>
											<ImageIcon className="size-2.5" />
										</div>
										<span className="truncate">2025 Gala Highlights</span>
									</div>
									<ChevronRight className="size-3 text-muted-foreground shrink-0 ml-1" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* 5. CTA BANNER (Mirroring EventCreationCTABanner) */}
				<div className="relative w-full overflow-hidden p-4 sm:p-5 text-white bg-neutral-950">
					<img
						src="/landing/cta/cta_image.png"
						alt=""
						aria-hidden="true"
						className="absolute inset-0 w-full h-full object-cover object-center opacity-25"
					/>
					<div className="relative z-10 space-y-2 max-w-sm">
						<h4 className="text-xs sm:text-sm font-black uppercase tracking-tight font-millik leading-tight">
							About{" "}
							<span style={{ color: primaryColor || "#ca0808" }}>Unforgettable</span>{" "}
							Events?
						</h4>
						<p className="text-[9px] text-neutral-300 leading-normal">
							Join thousands of event organizers who trust fextiva to power their events.
						</p>
						<div className="flex items-center gap-2 pt-1">
							<div
								className="h-6 px-2.5 rounded-md text-[9px] font-bold text-white flex items-center gap-1 shadow-none"
								style={{ backgroundColor: primaryColor || "#ca0808" }}
							>
								<span>Create Event</span>
								<ArrowRight className="size-2.5" />
							</div>
							<div className="h-6 px-2 rounded-md border border-neutral-700 bg-neutral-900/80 text-[9px] font-semibold text-neutral-300 flex items-center gap-1">
								<CalendarDays className="size-2.5" />
								<span>See All Events</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function OrgThemeColors({
	primaryColor,
	setPrimaryColor,
	secondaryColor,
	setSecondaryColor,
	tertiaryColor,
	setTertiaryColor,
	logoUrl,
	bannerUrl,
	orgName,
	description,
	websiteUrl,
	contactEmail,
	phone,
	socialLinks,
	slug,
}: OrgThemeColorsProps) {
	const [activeRole, setActiveRole] = useState<ColorRole>("primary");

	const handleApplyTheme = (theme: (typeof PRESET_THEMES)[number]) => {
		setPrimaryColor(theme.primary);
		setSecondaryColor(theme.secondary);
		setTertiaryColor(theme.tertiary);
	};

	const roleConfigs: Record<
		ColorRole,
		{
			role: ColorRole;
			shortLabel: string;
			fullLabel: string;
			usage: string;
			color: string;
			onChange: (color: string) => void;
		}
	> = {
		primary: {
			role: "primary",
			shortLabel: "Primary",
			fullLabel: "Primary Brand Color",
			usage: "Main identity, primary buttons, headers",
			color: primaryColor,
			onChange: setPrimaryColor,
		},
		secondary: {
			role: "secondary",
			shortLabel: "Secondary",
			fullLabel: "Secondary Accent Color",
			usage: "Badges, ticket stubs, highlights",
			color: secondaryColor,
			onChange: setSecondaryColor,
		},
		tertiary: {
			role: "tertiary",
			shortLabel: "Tertiary",
			fullLabel: "Tertiary Accent Color",
			usage: "Dividers, badges, contrast accents",
			color: tertiaryColor,
			onChange: setTertiaryColor,
		},
	};

	const currentConfig = roleConfigs[activeRole];

	return (
		<Card>
			<CardContent className="pt-6 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
				{/* Left Column: Color Controls */}
				<div className="xl:col-span-6 space-y-4">
					<div>
						<div className="flex items-center gap-2 text-lg font-bold text-foreground">
							<Palette className="size-5 text-primary" />
							Brand Colors
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Customize your organization's signature palette across all public events, passes, and tickets.
						</p>
					</div>

					{/* Curated Themes Bar (Compact single row) */}
					<div className="space-y-2 p-3 rounded-xl border bg-muted/20">
						<div className="flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
								Curated Themes
							</span>
							<span className="text-[10px] text-muted-foreground">Click to apply 3-color palette</span>
						</div>
						<div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
							{PRESET_THEMES.map((theme) => {
								const isActive =
									primaryColor.toLowerCase() === theme.primary.toLowerCase() &&
									secondaryColor.toLowerCase() === theme.secondary.toLowerCase() &&
									tertiaryColor.toLowerCase() === theme.tertiary.toLowerCase();

								return (
									<button
										key={theme.name}
										type="button"
										onClick={() => handleApplyTheme(theme)}
										className={cn(
											"shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer",
											isActive
												? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
												: "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40"
										)}
										title={theme.name}
									>
										<span className="flex items-center -space-x-1 shrink-0">
											<span
												className="size-3 rounded-full border border-background shadow-2xs"
												style={{ backgroundColor: theme.primary }}
											/>
											<span
												className="size-3 rounded-full border border-background shadow-2xs"
												style={{ backgroundColor: theme.secondary }}
											/>
											<span
												className="size-3 rounded-full border border-background shadow-2xs"
												style={{ backgroundColor: theme.tertiary }}
											/>
										</span>
										<span className="whitespace-nowrap text-[11px]">{theme.name.split(" (")[0]}</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* 3 Color Roles Selector */}
					<div className="space-y-1.5">
						<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							Select Color Role to Edit
						</span>
						<div className="grid grid-cols-3 gap-2">
							{(["primary", "secondary", "tertiary"] as const).map((role) => {
								const conf = roleConfigs[role];
								const isSelected = activeRole === role;
								const isLight = isLightHex(conf.color);
								return (
									<button
										key={role}
										type="button"
										onClick={() => setActiveRole(role)}
										className={cn(
											"p-2.5 rounded border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer",
											isSelected
												? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-xs"
												: "border-border/60 bg-card hover:border-border hover:bg-muted/30"
										)}
									>
										<div className="flex items-center justify-between gap-1 w-full">
											<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
												{conf.shortLabel}
											</span>
											<span
												className={cn(
													"size-4.5 rounded-full shrink-0 shadow-2xs border",
													isLight ? "border-border/80" : "border-black/10 dark:border-white/20"
												)}
												style={{ backgroundColor: conf.color }}
											/>
										</div>
										<div>
											<p className="font-mono text-xs font-semibold uppercase text-foreground">
												{conf.color}
											</p>
											<p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
												{conf.usage}
											</p>
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* Active Role Color Palette Customizer */}
					<div className="p-4 rounded-xl border bg-muted/20 space-y-3.5">
						<div className="flex items-center justify-between flex-wrap gap-2">
							<div>
								<p className="text-xs font-bold text-foreground">
									{currentConfig.fullLabel}
								</p>
								<p className="text-[11px] text-muted-foreground mt-0.5">
									{currentConfig.usage}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={currentConfig.color}
									onChange={(e) => currentConfig.onChange(e.target.value)}
									className="size-8 rounded-md border cursor-pointer p-0.5 bg-background shrink-0"
								/>
								<Input
									value={currentConfig.color}
									onChange={(e) => currentConfig.onChange(e.target.value)}
									className="font-mono text-xs uppercase w-24 h-8"
									placeholder="#000000"
								/>
							</div>
						</div>

						{/* Swatches Grid */}
						<div className="space-y-1.5 pt-1 border-t border-border/50">
							<div className="flex items-center justify-between">
								<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
									Preset Swatches ({PRESET_COLORS.length})
								</span>
								<span className="text-[10px] text-muted-foreground">
									Click any color to apply to {currentConfig.shortLabel}
								</span>
							</div>
							<div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-10 gap-1.5">
								{PRESET_COLORS.map((color) => {
									const isSelected =
										currentConfig.color.toLowerCase() === color.value.toLowerCase();
									const isLight = isLightHex(color.value);
									return (
										<button
											key={`${activeRole}-${color.value}`}
											type="button"
											onClick={() => currentConfig.onChange(color.value)}
											className={cn(
												"group relative h-7 sm:h-8 w-full rounded-md transition-all border flex items-center justify-center shadow-2xs cursor-pointer",
												isLight ? "border-border/80" : "border-transparent",
												isSelected
													? "ring-2 ring-primary ring-offset-2 scale-110 border-foreground z-10"
													: "hover:scale-105 hover:shadow-xs"
											)}
											style={{ backgroundColor: color.value }}
											title={`${color.name} (${color.value}) - ${color.description}`}
										>
											{isSelected && (
												<Check
													className={cn(
														"size-3.5 stroke-[3]",
														isLight ? "text-neutral-900" : "text-white drop-shadow-md"
													)}
												/>
											)}
										</button>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				{/* Right Column: Sample Org Page Preview */}
				<div className="xl:col-span-6 flex flex-col items-center justify-start p-5 bg-muted/15 rounded-2xl border border-dashed space-y-3.5">
					<div className="w-full flex items-center justify-between">
						<p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
							Live Organization Page Preview
						</p>
						<span className="text-[10px] font-semibold text-muted-foreground">
							Updates in real-time
						</span>
					</div>

					<OrgPageSamplePreview
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						tertiaryColor={tertiaryColor}
						logoUrl={logoUrl}
						bannerUrl={bannerUrl}
						orgName={orgName}
						description={description}
						websiteUrl={websiteUrl}
						contactEmail={contactEmail}
						phone={phone}
						slug={slug}
						socialLinks={socialLinks}
					/>

					<p className="text-[10px] text-muted-foreground/70 italic text-center">
						This preview shows how your public profile, banner, brand accents, and event cards appear to attendees.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
