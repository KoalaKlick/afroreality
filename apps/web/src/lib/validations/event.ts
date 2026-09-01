// src/lib/validations/event.ts
//
// Event validation schemas using Zod v4.
// Adapted from fextiva/lib/validations/event.ts.
// Changes: removed VotingMode (not in Prisma schema), updated enum values,
//          updated import aliases to `@/lib/constants/enums`.

import { z } from "zod";
import { EventStatus, EventType } from "@/lib/constants/enums";

export const eventTitleSchema = z
	.string()
	.min(3, "Event title must be at least 3 characters")
	.max(200, "Event title must be at most 200 characters");

export const eventSlugSchema = z
	.string()
	.min(2, "Slug must be at least 2 characters")
	.max(100, "Slug must be at most 100 characters")
	.regex(
		/^[a-z0-9-]+$/,
		"Slug can only contain lowercase letters, numbers, and hyphens",
	);

export const eventDescriptionSchema = z
	.string()
	.max(5000, "Description must be at most 5000 characters")
	.optional()
	.or(z.literal(""));

export const eventTypeSchema = z.enum(
	Object.values(EventType) as [string, ...string[]],
	{
		error: "Please select a valid event type",
	},
);

export const eventStatusSchema = z.enum(
	Object.values(EventStatus) as [string, ...string[]],
	{
		error: "Please select a valid event status",
	},
);

export const storagePathSchema = z.string().optional().or(z.literal(""));

export const urlSchema = z
	.string()
	.url("Invalid URL")
	.optional()
	.or(z.literal(""));

export const eventDateSchema = z
	.string()
	.datetime({ message: "Invalid date format" })
	.or(z.date())
	.optional();

export const venueNameSchema = z
	.string()
	.max(200, "Venue name must be at most 200 characters")
	.optional()
	.or(z.literal(""));

export const venueAddressSchema = z
	.string()
	.max(500, "Venue address must be at most 500 characters")
	.optional()
	.or(z.literal(""));

export const venueCitySchema = z
	.string()
	.max(100, "City must be at most 100 characters")
	.optional()
	.or(z.literal(""));

export const venueCountrySchema = z
	.string()
	.max(100, "Country must be at most 100 characters")
	.default("Ghana");

export const maxAttendeesSchema = z
	.number()
	.int()
	.min(1, "Must have at least 1 attendee")
	.max(100000, "Maximum 100,000 attendees")
	.optional()
	.nullable();

export const timezoneSchema = z.string().default("Africa/Accra");

export const timezoneOptions = [
	"Africa/Accra",
	"Africa/Lagos",
	"Africa/Nairobi",
	"Africa/Johannesburg",
	"Africa/Accra",
	"America/New_York",
	"Europe/London",
	"Asia/London",
	"Asia/Tokyo",
] as const;

export const createEventStep1Schema = z.object({
	title: eventTitleSchema,
	slug: eventSlugSchema,
	type: eventTypeSchema,
	description: eventDescriptionSchema,
	status: eventStatusSchema.optional().default("draft"),
});

export const createEventStep2Schema = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	timezone: timezoneSchema,
	isVirtual: z.boolean().default(false),
	virtualLink: urlSchema,
	venueName: venueNameSchema,
	venueAddress: venueAddressSchema,
	venueCity: venueCitySchema,
	venueCountry: venueCountrySchema,
});

export const createEventStep3Schema = z.object({
	flierImage: storagePathSchema,
	bannerImage: storagePathSchema,
	maxAttendees: z.coerce
		.number()
		.int()
		.min(1)
		.max(100000)
		.optional()
		.nullable(),
	isPublic: z.boolean().default(true),
	hasUssd: z.boolean().default(false),
	ussdCode: z
		.string()
		.regex(/^[*#0-9]+$/, "USSD code must contain only digits, * and #")
		.optional()
		.nullable(),
});

export const eventSponsorSchema = z.object({
	name: z.string().min(1, "Sponsor name is required").max(100),
	logo: z.string().optional().or(z.literal("")),
});

export const eventSocialLinkSchema = z.object({
	url: z.string().url("Invalid social link URL"),
});

export const eventGalleryLinkSchema = z.object({
	name: z.string().min(1, "Gallery name is required").max(100),
	url: z.string().url("Invalid gallery link URL"),
});

export const createEventStep4Schema = z.object({
	sponsors: z
		.array(eventSponsorSchema)
		.max(10, "Maximum 10 sponsors allowed")
		.optional()
		.default([]),
	socialLinks: z
		.array(eventSocialLinkSchema)
		.max(10, "Maximum 10 social links allowed")
		.optional()
		.default([]),
	galleryLinks: z
		.array(eventGalleryLinkSchema)
		.max(10, "Maximum 10 gallery links allowed")
		.optional()
		.default([]),
});

export const createEventSchema = z.object({
	title: eventTitleSchema,
	slug: eventSlugSchema,
	type: eventTypeSchema,
	description: eventDescriptionSchema,
	status: eventStatusSchema.optional().default("draft"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	timezone: timezoneSchema,
	isVirtual: z.boolean().default(false),
	virtualLink: urlSchema,
	venueName: venueNameSchema,
	venueAddress: venueAddressSchema,
	venueCity: venueCitySchema,
	venueCountry: venueCountrySchema,
	flierImage: storagePathSchema,
	bannerImage: storagePathSchema,
	maxAttendees: z.coerce
		.number()
		.int()
		.min(1)
		.max(100000)
		.optional()
		.nullable(),
	isPublic: z.boolean().default(true),
	hasUssd: z.boolean().default(false),
	ussdCode: z
		.string()
		.regex(/^[*#0-9]+$/, "USSD code must contain only digits, * and #")
		.optional()
		.nullable(),
	sponsors: z.array(eventSponsorSchema).optional(),
	socialLinks: z.array(eventSocialLinkSchema).optional(),
	galleryLinks: z.array(eventGalleryLinkSchema).optional(),
});

export const updateEventSchema = z.object({
	title: eventTitleSchema.optional(),
	slug: eventSlugSchema.optional(),
	type: eventTypeSchema.optional(),
	status: eventStatusSchema.optional(),
	description: eventDescriptionSchema,
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	timezone: timezoneSchema.optional(),
	isVirtual: z.boolean().optional(),
	virtualLink: urlSchema,
	venueName: venueNameSchema,
	venueAddress: venueAddressSchema,
	venueCity: venueCitySchema,
	venueCountry: venueCountrySchema,
	flierImage: storagePathSchema,
	bannerImage: storagePathSchema,
	maxAttendees: z.coerce
		.number()
		.int()
		.min(1)
		.max(100000)
		.optional()
		.nullable(),
	isPublic: z.boolean().optional(),
	hasUssd: z.boolean().optional(),
	ussdCode: z
		.string()
		.regex(/^[*#0-9]+$/, "USSD code must contain only digits, * and #")
		.optional()
		.nullable(),
	sponsors: z.array(eventSponsorSchema).optional(),
	socialLinks: z.array(eventSocialLinkSchema).optional(),
	galleryLinks: z.array(eventGalleryLinkSchema).optional(),
});

export type CreateEventStep1Input = z.infer<typeof createEventStep1Schema>;
export type CreateEventStep2Input = z.infer<typeof createEventStep2Schema>;
export type CreateEventStep3Input = z.infer<typeof createEventStep3Schema>;
export type CreateEventStep4Input = z.infer<typeof createEventStep4Schema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const TOTAL_EVENT_CREATION_STEPS = 4;

export const EVENT_TYPES = [
	{
		value: "ticketed" as const,
		label: "Ticketed Event",
		description: "Sell tickets to your event",
	},
	{
		value: "voting" as const,
		label: "Voting Event",
		description: "Run polls or award shows with voting",
	},
	{
		value: "standard" as const,
		label: "Standard Event",
		description: "General event for showcase and attendance",
	},
] as const;

export const VOTING_MODES = [
	{
		value: "general" as const,
		label: "General Voting",
		description:
			"Open to anyone. Requires payment to vote. Unlimited votes allowed. Results can be public",
	},
	{
		value: "internal" as const,
		label: "Internal Voting",
		description:
			"Restricted to members added to the event by the organizer. Can be free. Only participation status is shown.",
	},
] as const;

export function isVotingEventType(type: string): boolean {
	return type === "voting" || type === "hybrid";
}
