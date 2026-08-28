// src/lib/validations/voting.ts
//
// Voting validation schemas using Zod v4.
// Adapted for Prisma schema (ApprovalStatus replaces old VotingOptionStatus).

import { z } from "zod";
import { ApprovalStatus } from "@/lib/constants/enums";
import {
	DEFAULT_NOMINATION_PRICE,
	DEFAULT_VOTE_PRICE,
	MIN_NOMINATION_PRICE,
	MIN_VOTE_PRICE,
} from "@/lib/constants/pricing";

export const votingCategoryNameSchema = z
	.string()
	.min(1, "Category name is required")
	.max(200, "Category name must be at most 200 characters");

export const votingCategoryDescriptionSchema = z
	.string()
	.max(5000, "Description must be at most 5000 characters")
	.optional()
	.or(z.literal(""));

export const maxVotesPerUserSchema = z
	.number()
	.int()
	.min(1, "Must allow at least 1 vote")
	.max(100, "Maximum 100 votes per user")
	.default(1);

export const nominationPriceSchema = z
	.number()
	.min(
		MIN_NOMINATION_PRICE,
		`Nomination price must be at least ${MIN_NOMINATION_PRICE}`,
	)
	.max(10000, "Nomination price is too high")
	.default(DEFAULT_NOMINATION_PRICE);

export const votePriceSchema = z
	.number()
	.min(MIN_VOTE_PRICE, `Vote price must be at least ${MIN_VOTE_PRICE}`)
	.max(10000, "Vote price is too high")
	.default(DEFAULT_VOTE_PRICE);

export const createVotingCategorySchema = z.object({
	eventId: z.string().uuid("Event ID is required"),
	name: votingCategoryNameSchema,
	description: votingCategoryDescriptionSchema,
	maxVotesPerUser: maxVotesPerUserSchema,
	allowMultiple: z.boolean().default(false),
	allowPublicNomination: z.boolean().default(false),
	nominationDeadline: z
		.string()
		.datetime({ message: "Invalid date format" })
		.optional()
		.nullable(),
	nominationPrice: nominationPriceSchema,
	votePrice: votePriceSchema,
	requireApproval: z.boolean().default(true),
	showTotalVotesPublicly: z.boolean().default(true),
	showFinalImage: z.boolean().default(true),
	templateImage: z.string().optional().nullable(),
	templateConfig: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateVotingCategorySchema = createVotingOptionSchemaBase();

function createVotingOptionSchemaBase() {
	return z.object({
		name: votingCategoryNameSchema.optional(),
		description: votingCategoryDescriptionSchema,
		maxVotesPerUser: maxVotesPerUserSchema.optional(),
		allowMultiple: z.boolean().optional(),
		allowPublicNomination: z.boolean().optional(),
		nominationDeadline: z
			.string()
			.datetime({ message: "Invalid date format" })
			.optional()
			.nullable(),
		nominationPrice: nominationPriceSchema.optional(),
		votePrice: votePriceSchema.optional(),
		requireApproval: z.boolean().optional(),
		showTotalVotesPublicly: z.boolean().optional(),
		showFinalImage: z.boolean().optional(),
		templateImage: z.string().optional().nullable(),
		templateConfig: z.record(z.string(), z.unknown()).optional().nullable(),
	});
}

export const createVotingOptionSchema = z.object({
	eventId: z.string().uuid("Event ID is required"),
	categoryId: z.string().uuid("Category ID is required"),
	optionText: z
		.string()
		.min(1, "Nominee name is required")
		.max(200, "Nominee name must be at most 200 characters"),
	description: z
		.string()
		.max(2000, "Description must be at most 2000 characters")
		.optional()
		.or(z.literal("")),
	imageUrl: z.string().optional().nullable(),
	nomineeCode: z
		.string()
		.max(20, "Nominee code must be at most 20 characters")
		.optional(),
});

export const updateVotingOptionSchema = z.object({
	optionText: z
		.string()
		.min(1, "Nominee name is required")
		.max(200, "Nominee name must be at most 200 characters")
		.optional(),
	description: z
		.string()
		.max(2000, "Description must be at most 2000 characters")
		.optional()
		.or(z.literal("")),
	imageUrl: z.string().optional().nullable(),
	categoryId: z.string().uuid("Category ID is required").optional(),
	nomineeCode: z
		.string()
		.max(20, "Nominee code must be at most 20 characters")
		.optional(),
});

export const approveNominationSchema = z.object({
	optionId: z.string().uuid("Option ID is required"),
});

export const rejectNominationSchema = z.object({
	optionId: z.string().uuid("Option ID is required"),
});

export const deleteVotingOptionSchema = z.object({
	optionId: z.string().uuid("Option ID is required"),
	deletionCode: z.string().max(20, "Invalid deletion code").optional(),
});

export const submitPublicNominationSchema = z.object({
	eventId: z.string().uuid("Event ID is required"),
	categoryId: z.string().uuid("Category ID is required"),
	optionText: z
		.string()
		.min(1, "Nominee name is required")
		.max(200, "Nominee name must be at most 200 characters"),
	email: z.string().email("Invalid email address").optional(),
	description: z
		.string()
		.max(2000, "Description must be at most 2000 characters")
		.optional(),
	imageUrl: z.string().optional(),
	nomineeCode: z
		.string()
		.max(20, "Nominee code must be at most 20 characters")
		.optional(),
	fieldValues: z
		.array(
			z.object({
				fieldId: z.string().uuid("Field ID is required"),
				value: z.string().min(1, "Value is required"),
			}),
		)
		.optional(),
});

export const castVoteSchema = z.object({
	eventId: z.string().uuid("Event ID is required"),
	categoryId: z.string().uuid("Category ID is required"),
	optionId: z.string().uuid("Option ID is required"),
	voteCount: z
		.number()
		.int()
		.min(1, "Must vote for at least 1 nominee")
		.default(1),
	voterId: z.string().uuid("Voter ID is required").optional(),
	voterEmail: z.string().email("Invalid email address").optional(),
	voterPhone: z
		.string()
		.regex(/^[+]?[0-9\s-]{7,20}$/, "Please enter a valid phone number")
		.optional(),
	eventMemberId: z.string().uuid("Event member ID is required").optional(),
});

export const optionStatusSchema = z.enum(
	Object.values(ApprovalStatus) as [string, ...string[]],
	{
		error: "Invalid option status",
	},
);

export type CreateVotingCategoryInput = z.infer<
	typeof createVotingCategorySchema
>;
export type CreateVotingOptionInput = z.infer<typeof createVotingOptionSchema>;
export type UpdateVotingOptionInput = z.infer<typeof updateVotingOptionSchema>;
export type SubmitPublicNominationInput = z.infer<
	typeof submitPublicNominationSchema
>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
export type ApproveNominationInput = z.infer<typeof approveNominationSchema>;
export type RejectNominationInput = z.infer<typeof rejectNominationSchema>;
export type DeleteVotingOptionInput = z.infer<typeof deleteVotingOptionSchema>;
