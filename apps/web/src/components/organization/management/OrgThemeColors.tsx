// src/components/organization/management/OrgThemeColors.tsx

"use client";

import { Palette, Check, Sparkles, Building2, Users, ArrowRight, Globe, Mail, Phone, Calendar, MapPin, Share2, Ticket as TicketIcon, Trophy, ImageIcon, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform } from "@/lib/utils/event-icons";
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

function ColorPresetPicker({
	label,
	value,
	onChange,
}: {
	readonly label: string;
	readonly value: string;
	readonly onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label className="text-xs font-bold uppercase tracking-wider">{label}</Label>
				<span className="text-xs font-mono font-semibold text-muted-foreground uppercase">
					{value}
				</span>
			</div>

			<div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
				{PRESET_COLORS.map((color) => {
					const isSelected =
						value.toLowerCase() === color.value.toLowerCase();
					return (
						<button
							key={`${label}-${color.value}`}
							type="button"
							onClick={() => onChange(color.value)}
							className={cn(
								"group relative h-9 w-full rounded-lg transition-all border flex items-center justify-center shadow-2xs",
								isSelected
									? "ring-2 ring-primary ring-offset-2 scale-105 border-white dark:border-black"
									: "border-border/40 hover:scale-105 hover:shadow-xs",
							)}
							style={{ backgroundColor: color.value }}
							title={`${color.name} (${color.value}) - ${color.description}`}
						>
							{isSelected && (
								<Check className="size-4 text-white drop-shadow-md stroke-[3]" />
							)}
						</button>
					);
				})}
			</div>

			<div className="flex items-center gap-2 pt-1">
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="size-9 rounded-md border cursor-pointer p-0.5 bg-background shrink-0"
				/>
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="font-mono text-xs uppercase max-w-[140px]"
					placeholder="#000000"
				/>
			</div>
		</div>
	);
}

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
	readonly slug?: string;
	readonly socialLinks?: string[];
}) {
	const logoDisplayUrl = logoUrl ? getOrgImageUrl(logoUrl) : null;
	const bannerDisplayUrl = bannerUrl ? getOrgImageUrl(bannerUrl) : null;
	const displayName = orgName?.trim() || "fextiva Partner Org";
	const orgSlug = slug || "organization";

	// Default preview links if none provided
	const displaySocials =
		socialLinks && socialLinks.filter((s) => s.trim() !== "").length > 0
			? socialLinks.filter((s) => s.trim() !== "")
			: ["https://x.com", "https://instagram.com", "https://linkedin.com"];

	return (
		<div className="w-full rounded-xl border bg-background shadow-none overflow-hidden flex flex-col text-foreground transition-all duration-300">
			{/* Mock Browser Topbar */}
			<div className="px-3.5 py-2.5 bg-muted/60 border-b flex items-center justify-between text-[11px] text-muted-foreground select-none">
				<div className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-red-400/80" />
					<span className="size-2 rounded-full bg-yellow-400/80" />
					<span className="size-2 rounded-full bg-green-400/80" />
				</div>
				<div className="font-mono px-2.5 py-0.5 rounded-md bg-background/80 border text-[10px] text-foreground/80 truncate max-w-[200px]">
					fextiva.com/{orgSlug}
				</div>
				<span className="text-[9px] font-bold uppercase tracking-wider text-primary">
					Live Preview
				</span>
			</div>

			{/* Org Page Hero / Banner */}
			<div className="relative h-28 sm:h-36 w-full overflow-hidden bg-muted/30">
				{bannerDisplayUrl ? (
					<img
						src={bannerDisplayUrl}
						alt={displayName}
						className="w-full h-full object-cover"
					/>
				) : (
					<svg
						viewBox="0 0 1440 260"
						preserveAspectRatio="none"
						className="w-full h-full"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							width="1440"
							height="260"
							fill={primaryColor || "#ca0808"}
							fillOpacity="0.08"
						/>
						<polygon
							points="0,0 520,0 200,260 0,260"
							fill={secondaryColor || "#e88722"}
							fillOpacity="0.85"
						/>
						<polygon
							points="100,0 380,0 260,260 0,180"
							fill={primaryColor || "#ca0808"}
							fillOpacity="0.95"
						/>
						<polygon
							points="0,0 180,0 0,180"
							fill={tertiaryColor || "#53967a"}
							fillOpacity="0.90"
						/>
						<polygon
							points="320,0 640,0 380,260 260,260"
							fill={secondaryColor || "#e88722"}
							fillOpacity="0.35"
						/>
					</svg>
				)}
			</div>

			{/* Org Profile Header Overlay (Matching current OrgProfileHero layout) */}
			<div className="px-4 pb-4 -mt-8 relative z-10 space-y-3">
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
					{/* Left: Logo + Details */}
					<div className="flex items-end gap-3">
						{/* Logo Avatar */}
						<div className="size-16 sm:size-18 rounded-xl bg-background p-1 border-2 border-background shadow-none shrink-0 overflow-hidden flex items-center justify-center">
							{logoDisplayUrl ? (
								<img
									src={logoDisplayUrl}
									alt={displayName}
									className="w-full h-full object-cover rounded-lg"
								/>
							) : (
								<div
									className="w-full h-full rounded-lg flex items-center justify-center font-bold font-millik text-base"
									style={{
										backgroundColor: `color-mix(in srgb, ${primaryColor || "#ca0808"} 15%, transparent)`,
										color: primaryColor || "#ca0808",
									}}
								>
									{getInitials(displayName)}
								</div>
							)}
						</div>

						{/* Title & Stats */}
						<div className="space-y-0.5">
							<h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-foreground line-clamp-1 font-millik">
								{displayName}
							</h3>
							<div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
								<span className="text-foreground/80 font-semibold">@{orgSlug}</span>
								<span>•</span>
								<div className="flex items-center gap-0.5">
									<Calendar className="size-2.5 text-primary" />
									<span>8 Events</span>
								</div>
								{contactEmail && (
									<>
										<span>•</span>
										<div className="flex items-center gap-0.5 text-foreground/80">
											<Mail className="size-2.5 text-primary" />
											<span className="truncate max-w-[85px]">{contactEmail}</span>
										</div>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Right: Social Media Handles & Action Buttons */}
					<div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
						{/* Social Icons */}
						<div className="flex items-center gap-1">
							{displaySocials.slice(0, 3).map((url, i) => {
								const plat = getSocialPlatform(url, "size-2.5");
								return (
									<div
										key={i}
										className="size-6 rounded-md border border-border bg-card flex items-center justify-center text-foreground shadow-none"
										title={plat.name}
									>
										{plat.icon}
									</div>
								);
							})}
						</div>

						{/* Share Mock Button */}
						<div className="h-6 px-2 rounded-md border border-border bg-card flex items-center gap-1 text-[9px] font-semibold text-muted-foreground select-none">
							<Share2 className="size-2.5" />
							<span>Share</span>
						</div>

						{/* Request to Join Button */}
						<div
							className="h-6 px-2.5 rounded-md text-[9px] font-bold text-white shadow-none flex items-center gap-1 select-none"
							style={{ backgroundColor: primaryColor || "#ca0808" }}
						>
							<span>Request to Join</span>
							<ArrowRight className="size-2.5" />
						</div>
					</div>
				</div>

				{/* Pan-African Colored Divider */}
				<div className="h-1 w-full rounded-full flex overflow-hidden">
					<div className="flex-1" style={{ backgroundColor: primaryColor || "#ca0808" }} />
					<div className="flex-1" style={{ backgroundColor: secondaryColor || "#e88722" }} />
					<div className="flex-1" style={{ backgroundColor: tertiaryColor || "#53967a" }} />
				</div>

				{/* Sample "Our Events" Section */}
				<div className="space-y-2 pt-1">
					<div className="flex items-center justify-between">
						<span className="text-[11px] font-black uppercase tracking-wider text-foreground font-millik">
							Our Events.
						</span>
						<span
							className="text-[10px] font-bold"
							style={{ color: primaryColor || "#ca0808" }}
						>
							View all
						</span>
					</div>

					{/* Sample Event Card */}
					<div className="rounded-xl border bg-card p-2.5 flex items-center gap-3 transition-colors hover:border-primary/40">
						<div
							className="size-10 rounded-lg shrink-0 flex flex-col items-center justify-center text-white text-[9px] font-black leading-tight"
							style={{
								background: `${secondaryColor || "#e88722"}`,
							}}
						>
							<span>OCT</span>
							<span className="text-xs">24</span>
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-bold text-foreground truncate font-millik">
								Pan-African Cultural Gala &amp; Awards
							</p>
							<div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
								<MapPin className="size-2.5 shrink-0" />
								<span className="truncate">Accra Convention Centre</span>
							</div>
						</div>
						<span
							className="px-2 py-1 rounded-md text-[10px] font-black uppercase text-white shrink-0"
							style={{ backgroundColor: primaryColor || "#ca0808" }}
						>
							Tickets
						</span>
					</div>
				</div>

				{/* Footer: Org details takes more span on left, Partners & Galleries on right */}
				<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 text-[10px] text-muted-foreground border-t border-dashed">
					{/* Left: About Org */}
					<div className="sm:col-span-7 space-y-1">
						<span className="font-bold text-foreground uppercase tracking-tight block text-[10px]">
							About {displayName}
						</span>
						<p className="line-clamp-2 leading-relaxed italic text-muted-foreground/80 text-[9px]">
							{description?.trim() ||
								`Official public profile for ${displayName}. Discover curated events, voting awards, and cultural summits.`}
						</p>
					</div>

					{/* Right: Partners & Galleries */}
					<div className="sm:col-span-5 space-y-2">
						<div>
							<span className="font-bold text-foreground uppercase tracking-tight flex items-center gap-1 text-[9px] mb-1">
								<Trophy className="size-2.5 text-primary" />
								<span>Partners</span>
							</span>
							<div className="flex items-center gap-1">
								{["Google", "MTN", "fextiva"].map((p) => (
									<span key={p} className="px-1.5 py-0.5 rounded border text-[8px] bg-card text-foreground font-semibold">
										{p}
									</span>
								))}
							</div>
						</div>

						<div>
							<span className="font-bold text-foreground uppercase tracking-tight flex items-center gap-1 text-[9px] mb-1">
								<ImageIcon className="size-2.5 text-primary" />
								<span>Galleries</span>
							</span>
							<div className="p-1 rounded border bg-card text-[8px] flex items-center justify-between text-foreground font-medium">
								<span className="truncate max-w-[80px]">2025 Gala Highlights</span>
								<ChevronRight className="size-2.5 text-muted-foreground" />
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
	const handleApplyTheme = (theme: (typeof PRESET_THEMES)[number]) => {
		setPrimaryColor(theme.primary);
		setSecondaryColor(theme.secondary);
		setTertiaryColor(theme.tertiary);
	};

	return (
		<Card>
			<CardContent className="pt-6 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
				{/* Left Column: Color Controls */}
				<div className="xl:col-span-6 space-y-6">
					<div>
						<div className="flex items-center gap-2 text-lg font-bold text-foreground">
							<Palette className="size-5 text-primary" />
							Brand Colors
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Customize your organization's signature palette across all public events, passes, and tickets.
						</p>
					</div>

					{/* Quick Curated Palette Themes */}
					<div className="space-y-2.5 p-4 rounded-xl border bg-muted/20">
						<div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
							<Sparkles className="size-3.5 text-primary" />
							<span>Curated Palette Themes</span>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
											"p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2",
											isActive
												? "border-primary bg-primary/5 ring-1 ring-primary shadow-2xs"
												: "bg-card hover:border-primary/40 hover:shadow-2xs",
										)}
									>
										<div className="min-w-0">
											<p className="text-xs font-bold truncate">{theme.name.split(" (")[0]}</p>
										</div>
										<div className="flex items-center -space-x-1.5 shrink-0">
											<span
												className="size-4 rounded-full border border-background shadow-2xs"
												style={{ backgroundColor: theme.primary }}
											/>
											<span
												className="size-4 rounded-full border border-background shadow-2xs"
												style={{ backgroundColor: theme.secondary }}
											/>
											<span
												className="size-4 rounded-full border border-background shadow-2xs"
												style={{ backgroundColor: theme.tertiary }}
											/>
										</div>
									</button>
								);
							})}
						</div>
					</div>

					<Separator />

					<ColorPresetPicker
						label="Primary Brand Color"
						value={primaryColor}
						onChange={setPrimaryColor}
					/>
					<Separator />
					<ColorPresetPicker
						label="Secondary Accent Color"
						value={secondaryColor}
						onChange={setSecondaryColor}
					/>
					<Separator />
					<ColorPresetPicker
						label="Tertiary Accent Color"
						value={tertiaryColor}
						onChange={setTertiaryColor}
					/>
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
