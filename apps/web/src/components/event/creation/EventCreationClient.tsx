"use client";
// src/components/event/creation/EventCreationClient.tsx
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCreationProgress } from "./EventCreationProgress";
import { EventStep1BasicInfo } from "./EventStep1BasicInfo";
import { EventStep2DateLocation } from "./EventStep2DateLocation";
import { EventStep3MediaSettings } from "./EventStep3MediaSettings";
import { EventStep4Extras } from "./EventStep4Extras";
import { createNewEvent } from "@/lib/server-functions/event-mgmt";
import { TOTAL_EVENT_CREATION_STEPS } from "@/lib/validations/event";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

interface EventFormData {
	title: string;
	slug: string;
	type: string;
	votingMode?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	timezone?: string;
	isVirtual?: boolean;
	virtualLink?: string;
	venueName?: string;
	venueAddress?: string;
	venueCity?: string;
	venueCountry?: string;
	latitude?: number | null;
	longitude?: number | null;
	flierImage?: string;
	bannerImage?: string;
	maxAttendees?: number | null;
	isPublic?: boolean;
	sponsors?: { name: string; logo?: string | null }[];
	socialLinks?: { url: string }[];
	galleryLinks?: { name: string; url: string }[];
}

interface EventCreationClientProps {
	readonly organizationId?: string;
}

export function EventCreationClient({
	organizationId,
}: EventCreationClientProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [formData, setFormData] = useState<Partial<EventFormData>>({});
	const [error, setError] = useState<string | null>(null);

	// Step 1 success - save basic info, move to step 2
	function handleStep1Success(data: {
		title: string;
		slug: string;
		type: string;
		votingMode?: string;
		description?: string;
	}) {
		setFormData((prev) => ({ ...prev, ...data }));
		setCurrentStep(1);
	}

	// Step 2 success - save date & location, move to step 3
	function handleStep2Success(data: {
		startDate?: string;
		endDate?: string;
		timezone: string;
		isVirtual: boolean;
		virtualLink?: string;
		venueName?: string;
		venueAddress?: string;
		venueCity?: string;
		venueCountry?: string;
		latitude?: number | null;
		longitude?: number | null;
	}) {
		setFormData((prev) => ({ ...prev, ...data }));
		setCurrentStep(2);
	}

	function handleStep2Skip() {
		setCurrentStep(2);
	}

	// Step 3 success - save media & settings, move to step 4
	function handleStep3Success(data: {
		flierImage?: string;
		bannerImage?: string;
		maxAttendees?: number | null;
		isPublic: boolean;
	}) {
		setFormData((prev) => ({ ...prev, ...data }));
		setCurrentStep(3);
	}

	function handleStep3Skip() {
		setCurrentStep(3);
	}

	// Step 4 success - save extras, submit form
	async function handleStep4Success(data: {
		sponsors?: { name: string; logo?: string | null }[];
		socialLinks?: { url: string }[];
		galleryLinks?: { name: string; url: string }[];
	}) {
		const fullData = { ...formData, ...data };
		await handleSubmit(fullData);
	}

	async function handleSubmit(data: Partial<EventFormData>) {
		if (!data.title || !data.slug || !data.type) {
			setError("Missing required fields. Please review all steps.");
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			const res = await createNewEvent({
				data: {
					organizationId: organizationId ?? "",
					title: data.title,
					slug: data.slug,
					type: data.type,
					description: data.description || undefined,
					startDate: data.startDate || new Date().toISOString(),
					endDate: data.endDate || undefined,
					venueName: data.venueName || undefined,
					flierImage: data.flierImage || undefined,
					bannerImage: data.bannerImage || undefined,
					isPublic: data.isPublic ?? true,
					isVirtual: data.isVirtual ?? false,
					virtualLink: data.virtualLink || undefined,
					venueAddress: data.venueAddress || undefined,
					venueCity: data.venueCity || undefined,
					venueCountry: data.venueCountry || undefined,
					latitude: data.latitude !== undefined && data.latitude !== null ? Number(data.latitude) : undefined,
					longitude: data.longitude !== undefined && data.longitude !== null ? Number(data.longitude) : undefined,
					timezone: data.timezone || "Africa/Accra",
					maxAttendees: data.maxAttendees ?? undefined,
					sponsors: data.sponsors ?? undefined,
					socialLinks: data.socialLinks ?? undefined,
					galleryLinks: data.galleryLinks ?? undefined,
				},
			});

			toast.success("Event created successfully!");
			void router.push(`/my-events/${res.id}`);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleBack() {
		setCurrentStep((prev) => Math.max(0, prev - 1));
	}

	return (
		<div className="space-y-6">
			{/* Header Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
						<Calendar className="size-6" />
						Create New Event
					</CardTitle>
					<CardDescription>
						Fill in the details below to create your new event. You can always edit these later.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Progress indicator */}
					<EventCreationProgress
						currentStep={currentStep}
						totalSteps={TOTAL_EVENT_CREATION_STEPS}
					/>
				</CardContent>
			</Card>

			{/* Error message */}
			{error && (
				<div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
					{error}
				</div>
			)}

			{/* Step content */}
			{currentStep === 0 && (
				<EventStep1BasicInfo
					initialData={formData}
					onSuccess={handleStep1Success}
				/>
			)}

			{currentStep === 1 && (
				<EventStep2DateLocation
					initialData={formData}
					onSuccess={handleStep2Success}
					onBack={handleBack}
					onSkip={handleStep2Skip}
				/>
			)}

			{currentStep === 2 && (
				<EventStep3MediaSettings
					initialData={formData}
					onSuccess={handleStep3Success}
					onBack={handleBack}
					onSkip={handleStep3Skip}
				/>
			)}

			{currentStep === 3 && (
				<EventStep4Extras
					initialData={formData}
					onSuccess={handleStep4Success}
					onBack={handleBack}
					isSubmitting={isSubmitting}
				/>
			)}
		</div>
	);
}
