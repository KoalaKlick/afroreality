// src/lib/validations/ticket.ts
//
// Ticket type and order validation schemas using Zod v4.

import { z } from "zod";
import { CurrencyCode, TicketStatus } from "@/lib/constants/enums";
import { MIN_TICKET_PRICE } from "@/lib/constants/pricing";

export const ticketTypeNameSchema = z
	.string()
	.min(1, "Ticket name is required")
	.max(200, "Ticket name must be at most 200 characters");

export const ticketTypeDescriptionSchema = z
	.string()
	.max(5000, "Description must be at most 5000 characters")
	.optional()
	.or(z.literal(""));

export const ticketTypePriceSchema = z
	.number()
	.min(
		MIN_TICKET_PRICE,
		`Price must be at least ${MIN_TICKET_PRICE}`,
	)
	.max(1000000, "Price must be at most 1,000,000")
	.multipleOf(0.1, { message: "Price must be in increments of 0.10" });

export const ticketTypeCurrencySchema = z
	.enum(Object.values(CurrencyCode) as [string, ...string[]], {
		error: "Please select a valid currency",
	})
	.default("NGN");

export const ticketTypeQuantitySchema = z
	.number()
	.int("Quantity must be a whole number")
	.min(1, "Must have at least 1 ticket")
	.max(1000000, "Quantity must be at most 1,000,000");

export const ticketTypeStatusSchema = z
	.enum(Object.values(TicketStatus) as [string, ...string[]], {
		error: "Please select a valid status",
	})
	.default("available");

export const createTicketTypeSchema = z.object({
	eventId: z.string().uuid("Event ID is required"),
	name: ticketTypeNameSchema,
	description: ticketTypeDescriptionSchema,
	price: ticketTypePriceSchema,
	currency: ticketTypeCurrencySchema,
	quantityTotal: ticketTypeQuantitySchema.optional().nullable(),
	salesStart: z
		.string()
		.datetime({ message: "Invalid date format" })
		.optional()
		.nullable(),
	salesEnd: z
		.string()
		.datetime({ message: "Invalid date format" })
		.optional()
		.nullable(),
	maxPerOrder: z
		.number()
		.int()
		.min(1, "Must allow at least 1 per order")
		.max(100, "Maximum 100 per order")
		.default(10),
	minPerOrder: z
		.number()
		.int()
		.min(1, "Must allow at least 1 per order")
		.max(100, "Maximum 100 per order")
		.default(1),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
		.optional()
		.nullable(),
	primaryColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
		.optional()
		.nullable(),
	secondaryColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
		.optional()
		.nullable(),
	designVariant: z
		.enum(["classic", "modern", "geo", "retro"], {
			error: "Please select a valid design variant",
		})
		.optional()
		.nullable(),
});

export const updateTicketTypeSchema = createTicketTypeSchema.partial().extend({
	id: z.string().uuid("Ticket type ID is required"),
	status: ticketTypeStatusSchema,
});

export const deleteTicketTypeSchema = z.object({
	ticketTypeId: z.string().uuid("Ticket type ID is required"),
});

export const initiateTicketOrderSchema = z.object({
	eventId: z.string().uuid("Event ID is required"),
	buyerName: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(100, "Name must be at most 100 characters"),
	buyerPhone: z
		.string()
		.regex(/^[+]?[0-9\s-]{7,20}$/, "Please enter a valid phone number")
		.optional(),
	items: z
		.array(
			z.object({
				ticketTypeId: z.string().uuid("Ticket type ID is required"),
				quantity: z
					.number()
					.int()
					.min(1, "Must order at least 1 ticket")
					.max(100, "Maximum 100 tickets per order"),
			}),
		)
		.min(1, "Must order at least 1 type of ticket"),
});

export type CreateTicketTypeInput = z.infer<typeof createTicketTypeSchema>;
export type UpdateTicketTypeInput = z.infer<typeof updateTicketTypeSchema>;
export type InitiateTicketOrderInput = z.infer<
	typeof initiateTicketOrderSchema
>;
export type DeleteTicketTypeInput = z.infer<typeof deleteTicketTypeSchema>;
