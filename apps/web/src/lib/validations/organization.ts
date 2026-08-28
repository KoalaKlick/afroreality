// src/lib/validations/organization.ts
//
// Organization validation schemas using Zod v4.
// Adapted from afrotix/lib/validations/organization.ts.

import { z } from "zod";

export const RESERVED_SLUGS = [
	"contact",
	"events",
	"about",
	"help",
	"support",
	"terms",
	"privacy",
	"blog",
	"news",
	"pricing",
	"features",
	"faq",
	"auth",
	"login",
	"register",
	"signup",
	"signin",
	"logout",
	"signout",
	"callback",
	"verify",
	"reset-password",
	"forgot-password",
	"confirmed",
	"dashboard",
	"settings",
	"profile",
	"account",
	"organization",
	"organizations",
	"org",
	"my-events",
	"promoter",
	"admin",
	"api",
	"app",
	"static",
	"assets",
	"public",
	"www",
	"mail",
	"email",
	"cdn",
	"img",
	"images",
	"js",
	"css",
	"fonts",
	"new",
	"create",
	"edit",
	"delete",
	"manage",
	"invite",
	"invitations",
	"join",
	"leave",
	"search",
	"explore",
	"discover",
	"home",
	"index",
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

export function isReservedSlug(slug: string): boolean {
	return RESERVED_SLUGS.includes(slug.toLowerCase() as ReservedSlug);
}

export const organizationNameSchema = z
	.string()
	.min(2, "Organization name must be at least 2 characters")
	.max(100, "Organization name must be at most 100 characters")
	.regex(
		/^[a-zA-Z0-9\s&'-]+$/,
		"Organization name can only contain letters, numbers, spaces, &, ', and hyphens",
	);

export const organizationSlugSchema = z
	.string()
	.min(2, "Slug must be at least 2 characters")
	.max(50, "Slug must be at most 50 characters")
	.regex(
		/^[a-z0-9-]+$/,
		"Slug can only contain lowercase letters, numbers, and hyphens",
	)
	.refine((slug) => !isReservedSlug(slug), {
		message: "This slug is reserved and cannot be used",
	});

export const organizationDescriptionSchema = z
	.string()
	.max(5000, "Description must be at most 5000 characters")
	.optional()
	.or(z.literal(""));

export const orgStoragePathSchema = z.string().optional().or(z.literal(""));

export const orgUrlSchema = z
	.string()
	.url("Invalid URL")
	.optional()
	.or(z.literal(""));

export const orgColorSchema = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
	.optional();

export const orgEmailSchema = z
	.string()
	.email("Invalid email address")
	.optional()
	.or(z.literal(""));

export const createOrgStep1Schema = z.object({
	name: organizationNameSchema,
	slug: organizationSlugSchema,
});

export const createOrgStep2Schema = z.object({
	logoUrl: orgStoragePathSchema,
	description: organizationDescriptionSchema,
});

export const createOrgStep3Schema = z.object({
	contactEmail: orgEmailSchema,
	websiteUrl: orgUrlSchema,
	primaryColor: orgColorSchema,
	secondaryColor: orgColorSchema,
	tertiaryColor: orgColorSchema,
});

export const createOrganizationSchema = z.object({
	name: organizationNameSchema,
	slug: organizationSlugSchema,
	description: organizationDescriptionSchema,
	logoUrl: orgStoragePathSchema,
});

export const updateOrganizationSchema = z.object({
	name: organizationNameSchema.optional(),
	slug: organizationSlugSchema.optional(),
	description: organizationDescriptionSchema,
	logoUrl: orgStoragePathSchema,
	bannerUrl: orgStoragePathSchema,
	faviconUrl: orgStoragePathSchema,
	contactEmail: orgEmailSchema,
	websiteUrl: orgUrlSchema,
	primaryColor: orgColorSchema,
	secondaryColor: orgColorSchema,
	tertiaryColor: orgColorSchema,
	phone: z
		.string()
		.regex(
			/^[+]?[0-9\s()-]{7,20}$/,
			"Phone number must be 7-20 digits with optional +",
		)
		.optional()
		.or(z.literal("")),
	paystackAccountName: z.string().optional().or(z.literal("")),
	paystackAccountNumber: z.string().optional().or(z.literal("")),
	paystackBankCode: z.string().optional().or(z.literal("")),
	subaccountCode: z.string().optional().or(z.literal("")),
	socialLinks: z.array(z.string().url("Invalid social URL")).optional(),
});

export type CreateOrgStep1Data = z.infer<typeof createOrgStep1Schema>;
export type CreateOrgStep2Data = z.infer<typeof createOrgStep2Schema>;
export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationData = z.infer<typeof updateOrganizationSchema>;

export const ORG_CREATION_STEPS = [
	{ id: 1, title: "Basic Info", description: "Name your organization" },
	{ id: 2, title: "Branding", description: "Add logo and description" },
] as const;

export const TOTAL_ORG_CREATION_STEPS = ORG_CREATION_STEPS.length;

export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 50);
}
