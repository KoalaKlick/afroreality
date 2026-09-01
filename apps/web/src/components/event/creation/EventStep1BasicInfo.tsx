"use client";
// src/components/event/creation/EventStep1BasicInfo.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
	ArrowRight,
	Lock,
} from "lucide-react";
import {
	EVENT_TYPES,
	VOTING_MODES,
	isVotingEventType,
	createEventStep1Schema,
} from "@/lib/validations/event";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectionCard } from "./SelectionCard";

// SVG Illustrations - vibrant and detailed
function TicketIllustration({ className }: { className?: string }) {
	return (
		<svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="8" y="18" width="64" height="44" rx="6" fill="currentColor" fillOpacity="0.15"/>
			<rect x="8" y="18" width="64" height="44" rx="6" stroke="currentColor" strokeWidth="2" fill="none"/>
			<circle cx="22" cy="40" r="8" fill="currentColor" fillOpacity="0.3"/>
			<circle cx="22" cy="40" r="4" fill="currentColor" fillOpacity="0.6"/>
			<rect x="36" y="34" width="28" height="4" rx="2" fill="currentColor" fillOpacity="0.4"/>
			<rect x="36" y="42" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.3"/>
			<rect x="36" y="50" width="16" height="4" rx="2" fill="currentColor" fillOpacity="0.2"/>
			<path d="M68 28 V52" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round"/>
		</svg>
	);
}

function VoteIllustration({ className }: { className?: string }) {
	return (
		<svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="12" y="22" width="56" height="40" rx="6" fill="currentColor" fillOpacity="0.15"/>
			<rect x="12" y="22" width="56" height="40" rx="6" stroke="currentColor" strokeWidth="2" fill="none"/>
			<path d="M22 44 L34 56 L58 32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
			<rect x="12" y="12" width="35" height="12" rx="3" fill="currentColor" fillOpacity="0.4"/>
			<rect x="52" y="12" width="16" height="12" rx="3" fill="currentColor" fillOpacity="0.25"/>
		</svg>
	);
}

function StandardIllustration({ className }: { className?: string }) {
	return (
		<svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="10" y="12" width="60" height="56" rx="6" fill="currentColor" fillOpacity="0.15"/>
			<rect x="10" y="12" width="60" height="56" rx="6" stroke="currentColor" strokeWidth="2" fill="none"/>
			<rect x="18" y="22" width="24" height="18" rx="3" fill="currentColor" fillOpacity="0.35"/>
			<rect x="46" y="22" width="16" height="4" rx="2" fill="currentColor" fillOpacity="0.3"/>
			<rect x="46" y="30" width="12" height="4" rx="2" fill="currentColor" fillOpacity="0.25"/>
			<rect x="18" y="46" width="44" height="4" rx="2" fill="currentColor" fillOpacity="0.25"/>
			<rect x="18" y="54" width="32" height="4" rx="2" fill="currentColor" fillOpacity="0.2"/>
			<rect x="18" y="62" width="24" height="4" rx="2" fill="currentColor" fillOpacity="0.15"/>
		</svg>
	);
}

const typeIllustrations: Record<string, React.ReactNode> = {
	ticketed: <TicketIllustration className="text-violet-500" />,
	voting: <VoteIllustration className="text-sky-500" />,
	standard: <StandardIllustration className="text-amber-500" />,
};

const votingModeIllustrations: Record<string, React.ReactNode> = {
	general: (
		<svg className="text-primary" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="40" cy="40" r="28" fill="currentColor" fillOpacity="0.12"/>
			<circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="2" fill="none"/>
			<circle cx="40" cy="40" r="10" fill="currentColor" fillOpacity="0.35"/>
			<circle cx="40" cy="40" r="5" fill="currentColor" fillOpacity="0.7"/>
			<path d="M40 24 V30 M40 50 V56 M24 40 H30 M50 40 H56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
		</svg>
	),
	internal: (
		<svg className="text-secondary" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="12" y="18" width="56" height="44" rx="6" fill="currentColor" fillOpacity="0.12"/>
			<rect x="12" y="18" width="56" height="44" rx="6" stroke="currentColor" strokeWidth="2" fill="none"/>
			<circle cx="40" cy="36" r="10" fill="currentColor" fillOpacity="0.35"/>
			<path d="M28 56 Q40 46 52 56" stroke="currentColor" strokeWidth="2.5" fill="none"/>
			<path d="M56 24 Q68 30 68 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
		</svg>
	),
};

interface EventStep1Props {
	readonly initialData?: {
		title?: string;
		slug?: string;
		type?: string;
		votingMode?: string;
		description?: string;
	};
	readonly onSuccess: (data: {
		title: string;
		slug: string;
		type: string;
		votingMode?: string;
		description?: string;
	}) => void;
}

export function EventStep1BasicInfo({
	initialData,
	onSuccess,
}: EventStep1Props) {
	const [title, setTitle] = useState(initialData?.title ?? "");
	const [slug, setSlug] = useState(initialData?.slug ?? "");
	const [type, setType] = useState(initialData?.type ?? "ticketed");
	const [votingMode, setVotingMode] = useState(
		initialData?.votingMode ?? "general",
	);
	const [description, setDescription] = useState(
		initialData?.description ?? "",
	);
	const [errors, setErrors] = useState<Record<string, string[]>>({});

	// Auto-generate slug from title
	function handleTitleChange(value: string) {
		setTitle(value);
		const generatedSlug = value
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.slice(0, 100);
		setSlug(generatedSlug);
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setErrors({});

		const payload = {
			title,
			slug,
			type,
			votingMode: isVotingEventType(type) ? votingMode : undefined,
			description,
		};

		const parsed = createEventStep1Schema.safeParse(payload);
		if (parsed.success) {
			onSuccess({
				title: parsed.data.title,
				slug: parsed.data.slug,
				type: parsed.data.type,
				votingMode: isVotingEventType(type) ? votingMode : undefined,
				description: parsed.data.description,
			});
		} else {
			const formatted = parsed.error.flatten().fieldErrors;
			setErrors(formatted as Record<string, string[]>);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6 @container">
			{/* Event Type Selection */}
			<Card>
				<CardHeader>
					<CardTitle>Event Type</CardTitle>
					<CardDescription>Choose the type of event you want to create</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid @lg:grid-cols-3 gap-3">
						{EVENT_TYPES.map((eventType) => {
							const isSelected = type === eventType.value;

							return (
								<SelectionCard
									key={eventType.value}
									illustration={typeIllustrations[eventType.value] || <StandardIllustration className="text-primary" />}
									label={eventType.label}
									description={eventType.description}
									isSelected={isSelected}
									onClick={() => setType(eventType.value)}
								/>
							);
						})}
					</div>
					{errors.type && (
						<p className="text-sm text-destructive mt-3">{errors.type[0]}</p>
					)}
				</CardContent>
			</Card>

			{/* Voting Mode Selection (only for voting/hybrid events) */}
			{isVotingEventType(type) && (
				<Card>
					<CardHeader>
						<CardTitle>Voting Mode</CardTitle>
						<CardDescription className="flex items-center gap-1.5">
							<Lock className="size-3" />
							This cannot be changed after event creation
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid @lg:grid-cols-2 gap-3">
							{VOTING_MODES.map((mode) => {
								const isSelected = votingMode === mode.value;

								return (
									<SelectionCard
										key={mode.value}
										illustration={votingModeIllustrations[mode.value]}
										label={mode.label}
										description={mode.description}
										isSelected={isSelected}
										onClick={() => setVotingMode(mode.value)}
									/>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Event Details */}
			<Card>
				<CardHeader>
					<CardTitle>Event Details</CardTitle>
					<CardDescription>Enter the name and URL for your event</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Event Title */}
					<div className="space-y-2">
						<Label htmlFor="title">Event Title *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => handleTitleChange(e.target.value)}
							placeholder="e.g., Fextiva Beats Summer Festival 2026"
							className={errors.title ? "border-destructive" : ""}
						/>
						{errors.title && (
							<p className="text-sm text-destructive">{errors.title[0]}</p>
						)}
					</div>

					{/* Event Slug */}
					<div className="space-y-2">
						<Label htmlFor="slug">Event URL Slug *</Label>
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">/[org-slug]/event/</span>
							<Input
								id="slug"
								value={slug}
								onChange={(e) =>
									setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
								}
								placeholder="fextiva-beats-summer-2026"
								className={cn("flex-1", errors.slug ? "border-destructive" : "")}
							/>
						</div>
						{errors.slug ? (
							<p className="text-sm text-destructive">{errors.slug[0]}</p>
						) : (
							<p className="text-xs text-muted-foreground">
								This will be your event's unique URL
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Description */}
			<Card>
				<CardHeader>
					<CardTitle>Description</CardTitle>
					<CardDescription>Tell people what your event is about</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<RichTextEditor
							value={description}
							onChange={(val) => setDescription(val)}
							placeholder="Tell people what your event is about..."
						/>
						{errors.description && (
							<p className="text-sm text-destructive">{errors.description[0]}</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Submit */}
			<div className="flex justify-end pt-4">
				<Button
					type="submit"
					disabled={!title || !slug}
				>
					Continue
					<ArrowRight className="ml-2 size-4" />
				</Button>
			</div>
		</form>
	);
}
