"use client";
// src/components/event/creation/EventStep2DateLocation.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ArrowLeft,
	ArrowRight,
	MapPin,
	Globe,
	Calendar,
} from "lucide-react";
import { createEventStep2Schema } from "@/lib/validations/event";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectionCard } from "./SelectionCard";

// SVG Illustrations - vibrant and detailed
function InPersonIllustration({ className }: { className?: string }) {
	return (
		<svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="40" cy="24" r="14" fill="currentColor" fillOpacity="0.2"/>
			<circle cx="40" cy="24" r="14" stroke="currentColor" strokeWidth="2" fill="none"/>
			<path d="M18 68 Q18 44 40 38 Q62 44 62 68" fill="currentColor" fillOpacity="0.2"/>
			<path d="M18 68 Q18 44 40 38 Q62 44 62 68" stroke="currentColor" strokeWidth="2" fill="none"/>
			<circle cx="40" cy="24" r="5" fill="currentColor" fillOpacity="0.6"/>
			<path d="M40 8 V16 M40 32 V40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2"/>
		</svg>
	);
}

function VirtualIllustration({ className }: { className?: string }) {
	return (
		<svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="8" y="12" width="64" height="44" rx="6" fill="currentColor" fillOpacity="0.12"/>
			<rect x="8" y="12" width="64" height="44" rx="6" stroke="currentColor" strokeWidth="2" fill="none"/>
			<circle cx="40" cy="34" r="10" fill="currentColor" fillOpacity="0.35"/>
			<path d="M30 56 L50 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
			<rect x="22" y="62" width="36" height="4" rx="2" fill="currentColor" fillOpacity="0.25"/>
		</svg>
	);
}

function getFormatIllustration(format: "inPerson" | "virtual", isSelected: boolean) {
	const color = isSelected ? "text-primary" : "text-muted-foreground/60";
	return format === "inPerson" ? (
		<InPersonIllustration className={color} />
	) : (
		<VirtualIllustration className={color} />
	);
}

interface EventStep2Props {
	readonly initialData?: {
		startDate?: string;
		endDate?: string;
		timezone?: string;
		isVirtual?: boolean;
		virtualLink?: string;
		venueName?: string;
		venueAddress?: string;
		venueCity?: string;
		venueCountry?: string;
	};
	readonly onSuccess: (data: {
		startDate?: string;
		endDate?: string;
		timezone: string;
		isVirtual: boolean;
		virtualLink?: string;
		venueName?: string;
		venueAddress?: string;
		venueCity?: string;
		venueCountry?: string;
	}) => void;
	readonly onBack: () => void;
	readonly onSkip: () => void;
}

// Common African timezones
const TIMEZONES = [
	{ value: "Africa/Accra", label: "West Africa Time (WAT)" },
	{ value: "Africa/Nairobi", label: "East Africa Time (EAT)" },
	{ value: "Africa/Johannesburg", label: "South Africa Time (SAST)" },
	{ value: "Africa/Cairo", label: "Egypt Time (EET)" },
	{ value: "Europe/London", label: "UK Time (GMT/BST)" },
	{ value: "America/New_York", label: "US Eastern (EST/EDT)" },
];

export function EventStep2DateLocation({
	initialData,
	onSuccess,
	onBack,
	onSkip,
}: EventStep2Props) {
	const [isVirtual, setIsVirtual] = useState(initialData?.isVirtual ?? false);
	const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
	const [endDate, setEndDate] = useState(initialData?.endDate ?? "");
	const [timezone, setTimezone] = useState(
		initialData?.timezone ?? "Africa/Accra",
	);
	const [virtualLink, setVirtualLink] = useState(
		initialData?.virtualLink ?? "",
	);
	const [venueName, setVenueName] = useState(initialData?.venueName ?? "");
	const [venueAddress, setVenueAddress] = useState(
		initialData?.venueAddress ?? "",
	);
	const [venueCity, setVenueCity] = useState(initialData?.venueCity ?? "");
	const [venueCountry, setVenueCountry] = useState(
		initialData?.venueCountry ?? "Ghana",
	);
	const [errors, setErrors] = useState<Record<string, string[]>>({});

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setErrors({});

		const payload = {
			startDate: startDate ? new Date(startDate).toISOString() : undefined,
			endDate: endDate ? new Date(endDate).toISOString() : undefined,
			timezone,
			isVirtual,
			virtualLink: virtualLink || undefined,
			venueName: venueName || undefined,
			venueAddress: venueAddress || undefined,
			venueCity: venueCity || undefined,
			venueCountry,
		};

		const parsed = createEventStep2Schema.safeParse(payload);
		if (parsed.success) {
			onSuccess({
				startDate: startDate ? new Date(startDate).toISOString() : undefined,
				endDate: endDate ? new Date(endDate).toISOString() : undefined,
				timezone: parsed.data.timezone,
				isVirtual: parsed.data.isVirtual,
				virtualLink: parsed.data.virtualLink,
				venueName: parsed.data.venueName,
				venueAddress: parsed.data.venueAddress,
				venueCity: parsed.data.venueCity,
				venueCountry: parsed.data.venueCountry,
			});
		} else {
			const formatted = parsed.error.flatten().fieldErrors;
			setErrors(formatted as Record<string, string[]>);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6 @container">
			{/* Event Format */}
			<Card>
				<CardHeader>
					<CardTitle>Event Format</CardTitle>
					<CardDescription>Choose whether your event is in-person or virtual</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid @lg:grid-cols-2 gap-3">
						<SelectionCard
							illustration={getFormatIllustration("inPerson", !isVirtual)}
							label="In-Person"
							description="Host your event at a physical venue"
							isSelected={!isVirtual}
							onClick={() => setIsVirtual(false)}
						/>
						<SelectionCard
							illustration={getFormatIllustration("virtual", isVirtual)}
							label="Virtual"
							description="Host your event online with a meeting link"
							isSelected={isVirtual}
							onClick={() => setIsVirtual(true)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Date & Time */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="size-5" />
						Date & Time
					</CardTitle>
					<CardDescription>Set when your event starts and ends</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="startDate">Start Date & Time</Label>
							<Input
								id="startDate"
								type="datetime-local"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className={errors.startDate ? "border-destructive" : ""}
							/>
							{errors.startDate && (
								<p className="text-sm text-destructive">{errors.startDate[0]}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="endDate">End Date & Time</Label>
							<Input
								id="endDate"
								type="datetime-local"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								min={startDate}
								className={errors.endDate ? "border-destructive" : ""}
							/>
							{errors.endDate && (
								<p className="text-sm text-destructive">{errors.endDate[0]}</p>
							)}
						</div>
					</div>

					{/* Timezone */}
					<div className="space-y-2">
						<Label htmlFor="timezone">Timezone</Label>
						<select
							id="timezone"
							value={timezone}
							onChange={(e) => setTimezone(e.target.value)}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							{TIMEZONES.map((tz) => (
								<option key={tz.value} value={tz.value}>
									{tz.label}
								</option>
							))}
						</select>
					</div>
				</CardContent>
			</Card>

			{/* Virtual Link (if virtual) */}
			{isVirtual && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Globe className="size-5" />
							Virtual Event Link
						</CardTitle>
						<CardDescription>Add the link for attendees to join your virtual event</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="virtualLink">Meeting URL</Label>
							<div className="flex items-center gap-2">
								<Globe className="size-4 text-muted-foreground" />
								<Input
									id="virtualLink"
									type="url"
									value={virtualLink}
									onChange={(e) => setVirtualLink(e.target.value)}
									placeholder="https://zoom.us/j/..."
									className={cn(
										"flex-1",
										errors.virtualLink ? "border-destructive" : "",
									)}
								/>
							</div>
							{errors.virtualLink && (
								<p className="text-sm text-destructive">{errors.virtualLink[0]}</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Venue Details (if in-person) */}
			{!isVirtual && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MapPin className="size-5" />
							Venue Details
						</CardTitle>
						<CardDescription>Where will your event take place?</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="venueName">Venue Name</Label>
							<Input
								id="venueName"
								value={venueName}
								onChange={(e) => setVenueName(e.target.value)}
								placeholder="e.g., Eko Convention Center"
								className={errors.venueName ? "border-destructive" : ""}
							/>
							{errors.venueName && (
								<p className="text-sm text-destructive">{errors.venueName[0]}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="venueAddress">Address</Label>
							<Input
								id="venueAddress"
								value={venueAddress}
								onChange={(e) => setVenueAddress(e.target.value)}
								placeholder="Street address"
								className={errors.venueAddress ? "border-destructive" : ""}
							/>
							{errors.venueAddress && (
								<p className="text-sm text-destructive">
									{errors.venueAddress[0]}
								</p>
							)}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="venueCity">City</Label>
								<Input
									id="venueCity"
									value={venueCity}
									onChange={(e) => setVenueCity(e.target.value)}
									placeholder="e.g., Accra"
									className={errors.venueCity ? "border-destructive" : ""}
								/>
								{errors.venueCity && (
									<p className="text-sm text-destructive">
										{errors.venueCity[0]}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="venueCountry">Country</Label>
								<Input
									id="venueCountry"
									value={venueCountry}
									onChange={(e) => setVenueCountry(e.target.value)}
									placeholder="e.g., Ghana"
									className={errors.venueCountry ? "border-destructive" : ""}
								/>
								{errors.venueCountry && (
									<p className="text-sm text-destructive">
										{errors.venueCountry[0]}
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Actions */}
			<div className="flex justify-between pt-4">
				<Button type="button" variant="ghost" onClick={onBack}>
					<ArrowLeft className="mr-2 size-4" />
					Back
				</Button>

				<div className="flex gap-2">
					<Button type="button" variant="outline" onClick={onSkip}>
						Skip for Now
					</Button>
					<Button type="submit">
						Continue
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</div>
		</form>
	);
}
