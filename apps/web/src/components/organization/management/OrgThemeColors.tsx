// src/components/organization/management/OrgThemeColors.tsx

import { Palette } from "lucide-react";
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";
import { PRESET_COLORS } from "@/utils/theme/constants";

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
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-3">
			<Label>{label}</Label>
			<div className="flex flex-wrap gap-3">
				{PRESET_COLORS.map((color: any) => (
					<button
						key={`${label}-${color.value}`}
						type="button"
						onClick={() => onChange(color.value)}
						className={cn(
							"h-10 w-10 rounded-xl transition-all border-2",
							value === color.value
								? "border-black scale-110 shadow-md"
								: "border-transparent hover:scale-105",
						)}
						style={{ backgroundColor: color.value }}
						title={color.name}
					/>
				))}
			</div>
			<div className="flex gap-2">
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="size-9 rounded border cursor-pointer"
				/>
				<Input value={value} onChange={(e) => onChange(e.target.value)} />
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
	const logoDisplayUrl = logoUrl ? getOrgImageUrl(logoUrl) : null;

	return (
		<Card className="@container">
			<CardContent className="pt-6 @lg:grid @3xl:grid-cols-[auto_480px] @5xl:grid-cols-[auto_560px] @lg:gap-6">
				<div className="space-y-6">
					<div className="flex items-center gap-2 text-lg font-semibold">
						<Palette className="h-5 w-5" />
						Brand Colors
					</div>
					<p className="text-sm text-muted-foreground -mt-4">
						Customize your organization's color scheme
					</p>

					<ColorPresetPicker
						label="Primary Color"
						value={primaryColor}
						onChange={setPrimaryColor}
					/>
					<Separator />
					<ColorPresetPicker
						label="Secondary Color"
						value={secondaryColor}
						onChange={setSecondaryColor}
					/>
					<Separator />
					<ColorPresetPicker
						label="Tertiary Color"
						value={tertiaryColor}
						onChange={setTertiaryColor}
					/>
				</div>

				<div className="@lg:mt-0 min-h-96 place-content-center">
					<TicketRenderer
						variant="classic"
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						tertiaryColor={tertiaryColor}
						logoUrl={logoDisplayUrl}
						organizationName={orgName || undefined}
						stacked={true}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
