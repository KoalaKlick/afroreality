// src/lib/constants/endpoints.ts
//
// Reference-only endpoint registry from the legacy Quarkus backend.
// In this full-stack TanStack Start app, most of these are handled in-app
// by server functions (see src/lib/server-functions/). This file is kept
// for documentation and any remaining integrations that proxy to Quarkus.

export const endpoints = {
	auth: {
		register: "/api/v1/auth/register",
		login: "/api/v1/auth/login",
		magicLinkRequest: "/api/v1/auth/magic-link/request",
		magicLinkLogin: "/api/v1/auth/magic-link/login",
		oauth2Login: "/api/v1/auth/oauth2/login",
		verifyEmail: "/api/v1/auth/verify-email",
		resendVerification: "/api/v1/auth/resend-verification",
		forgotPassword: "/api/v1/auth/forgot-password",
		resetPassword: "/api/v1/auth/reset-password",
	},

	users: {
		get: (userId: string) => `/api/v1/users/${userId}`,
		update: (userId: string) => `/api/v1/users/${userId}`,
	},

	events: {
		create: "/api/v1/events",
		public: "/api/v1/events/public",
		get: (eventId: string) => `/api/v1/events/${eventId}`,
		update: (eventId: string) => `/api/v1/events/${eventId}`,
		delete: (eventId: string) => `/api/v1/events/${eventId}`,
		publish: (eventId: string) => `/api/v1/events/${eventId}/publish`,
		cancel: (eventId: string) => `/api/v1/events/${eventId}/cancel`,
		byOrganization: (organizationId: string) =>
			`/api/v1/events/organization/${organizationId}`,
		bySlug: (organizationId: string, slug: string) =>
			`/api/v1/events/org/${organizationId}/slug/${slug}`,
	},

	organizations: {
		search: "/api/v1/organizations",
		create: "/api/v1/organizations",
		get: (orgId: string) => `/api/v1/organizations/${orgId}`,
		update: (orgId: string) => `/api/v1/organizations/${orgId}`,
		getBySlug: (slug: string) => `/api/v1/organizations/slug/${slug}`,
		switch: (orgId: string) => `/api/v1/organizations/switch/${orgId}`,
		members: (orgId: string) => `/api/v1/organizations/${orgId}/members`,
		invitations: {
			list: (orgId: string) => `/api/v1/organizations/${orgId}/invitations`,
			invite: (orgId: string) => `/api/v1/organizations/${orgId}/invitations`,
			my: "/api/v1/organizations/invitations/my",
			accept: (token: string) =>
				`/api/v1/organizations/invitations/accept/${token}`,
			decline: (token: string) =>
				`/api/v1/organizations/invitations/decline/${token}`,
		},
		joinRequests: {
			list: (orgId: string) => `/api/v1/organizations/${orgId}/join-requests`,
			create: (orgId: string) => `/api/v1/organizations/${orgId}/join-requests`,
			resolve: (orgId: string, requestId: string) =>
				`/api/v1/organizations/${orgId}/join-requests/${requestId}`,
		},
	},

	tickets: {
		createType: "/api/v1/tickets/types",
		typesByEvent: (eventId: string) => `/api/v1/tickets/types/event/${eventId}`,
		initiateOrder: "/api/v1/tickets/orders",
		getByCode: (ticketCode: string) => `/api/v1/tickets/code/${ticketCode}`,
		checkIn: (ticketCode: string) => `/api/v1/tickets/check-in/${ticketCode}`,
	},

	payments: {
		initiate: "/api/v1/payments/initiate",
		verify: (reference: string) => `/api/v1/payments/verify/${reference}`,
		get: (reference: string) => `/api/v1/payments/${reference}`,
		walletByUser: (userId: string) => `/api/v1/payments/wallets/user/${userId}`,
		walletByOrganization: (organizationId: string) =>
			`/api/v1/payments/wallets/organization/${organizationId}`,
	},

	promoters: {
		apply: "/api/v1/promoters/apply",
		byUser: (userId: string) => `/api/v1/promoters/user/${userId}`,
		byCode: (referralCode: string) => `/api/v1/promoters/code/${referralCode}`,
	},

	voting: {
		createCategory: "/api/v1/voting/categories",
		categoriesByEvent: (eventId: string) =>
			`/api/v1/voting/categories/event/${eventId}`,
		createOption: "/api/v1/voting/options",
		optionsByCategory: (categoryId: string) =>
			`/api/v1/voting/options/category/${categoryId}`,
		vote: "/api/v1/voting/vote",
	},

	storage: {
		upload: "/api/v1/storage/upload",
		delete: "/api/v1/storage/delete",
		deleteByUrl: "/api/v1/storage/delete-by-url",
	},

	health: {
		check: "/api/v1/health",
	},
} as const;
