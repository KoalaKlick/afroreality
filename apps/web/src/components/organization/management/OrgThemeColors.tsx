// src/components/organization/management/OrgThemeColors.tsx

"use client";

import { useState } from "react";
import { Palette, Check, Sparkles, Layers } from "lucide-react";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getOrgImageUrl } from "@/lib/image-url-utils";
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
	readonly orgName: string;
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

export function OrgThemeColors({
	primaryColor,
	setPrimaryColor,
	secondaryColor,
	setSecondaryColor,
	tertiaryColor,
	setTertiaryColor,
	logoUrl,
	orgName,
}: OrgThemeColorsProps) {
	const [activeVariant, setActiveVariant] = useState<"classic" | "modern" | "geo" | "retro">("classic");
	const logoDisplayUrl = logoUrl ? getOrgImageUrl(logoUrl) : null;

	const handleApplyTheme = (theme: (typeof PRESET_THEMES)[number]) => {
		setPrimaryColor(theme.primary);
		setSecondaryColor(theme.secondary);
		setTertiaryColor(theme.tertiary);
	};

	return (
		<Card>
			<CardContent className="pt-6 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
				{/* Left Column: Color Controls */}
				<div className="xl:col-span-7 space-y-6">
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

				{/* Right Column: Live Pass & Brand Preview */}
				<div className="xl:col-span-5 flex flex-col items-center justify-center p-6 bg-muted/15 rounded-2xl border border-dashed min-h-[380px] space-y-4">
					<div className="w-full flex items-center justify-between">
						<p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
							Live Pass &amp; Brand Preview
						</p>

						{/* Pass Design Variant Switcher */}
						<div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border text-[10px] font-bold uppercase">
							{(["classic", "modern", "geo", "retro"] as const).map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => setActiveVariant(v)}
									className={cn(
										"px-2 py-1 rounded transition-all",
										activeVariant === v
											? "bg-primary text-primary-foreground shadow-2xs"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{v}
								</button>
							))}
						</div>
					</div>

					<div className="w-full flex items-center justify-center py-2">
						<TicketRenderer
							variant={activeVariant}
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
							tertiaryColor={tertiaryColor}
							logoUrl={logoDisplayUrl}
							organizationName={orgName || "Your Organization"}
							stacked={true}
						/>
					</div>

					<p className="text-[10px] text-muted-foreground/70 italic text-center">
						Click the ticket to flip between front pass and back verification QR code.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
