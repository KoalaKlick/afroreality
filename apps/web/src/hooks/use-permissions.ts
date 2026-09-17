"use client";

import { useOrganization } from "@/lib/organization-context";
import type { OrganizationInfo } from "@/lib/constants/navigation";

export interface UserPermissions {
	/** The user's role in the active organization: "owner" | "admin" | "member" | null */
	role: "owner" | "admin" | "member" | string | null;
	/** The active organization object itself */
	activeOrg: OrganizationInfo | null;
	/** The active organization's ID */
	activeOrgId: string | null;
	/** List of all organizations the user belongs to */
	organizations: OrganizationInfo[];

	// Role flags
	/** True if the user is the owner of the active organization */
	isOwner: boolean;
	/** True if the user is an admin of the active organization */
	isAdmin: boolean;
	/** True if the user is a standard member of the active organization */
	isMember: boolean;
	/** True if the user is either the owner or an admin */
	isAtLeastAdmin: boolean;

	// Permission & Action Flags
	/** True if the user can manage team members, invites, and join requests (Owner & Admin) */
	canManageMembers: boolean;
	/** True if the user can update organization general settings, branding, theme colors, etc. (Owner & Admin) */
	canManageSettings: boolean;
	/** True if the user can create, update, publish, or delete events (Owner & Admin) */
	canManageEvents: boolean;
	/** True if the user can manage tickets (Owner & Admin) */
	canManageTickets: boolean;
	/** True if the user can manage voting categories and options (Owner & Admin) */
	canManageVoting: boolean;
	/** True if the user can request wallet withdrawals (OWNER ONLY) */
	canWithdraw: boolean;
	/** True if the user can edit or configure payout accounts / bank / momo details (OWNER ONLY) */
	canManagePayouts: boolean;

	// Page View Flags (All members have view rights to organization pages)
	/** True if the user can view the wallet and transactions */
	canViewWallet: boolean;
	/** True if the user can view team members, invitations, and requests */
	canViewMembers: boolean;
	/** True if the user can view organization settings */
	canViewSettings: boolean;
	/** True if the user can view events */
	canViewEvents: boolean;

	/** True if the user has an active organization selected */
	hasActiveOrg: boolean;
}

export function usePermissions(overrideRole?: string | null): UserPermissions {
	let orgContext: ReturnType<typeof useOrganization> | null = null;
	try {
		orgContext = useOrganization();
	} catch {
		// safe fallback when rendered outside OrganizationProvider
	}

	const rawRole =
		(overrideRole !== undefined && overrideRole !== null
			? overrideRole
			: orgContext?.role) ?? null;

	const role = rawRole ? rawRole.toLowerCase() : null;
	const isOwner = role === "owner";
	const isAdmin = role === "admin";
	const isMember = role === "member";
	const isAtLeastAdmin = isOwner || isAdmin;
	const hasRole = !!role;

	return {
		role,
		activeOrg: orgContext?.activeOrg ?? null,
		activeOrgId: orgContext?.activeOrgId ?? null,
		organizations: orgContext?.organizations ?? [],
		isOwner,
		isAdmin,
		isMember,
		isAtLeastAdmin,
		// Management & Transactional action flags
		canManageMembers: isAtLeastAdmin,
		canManageSettings: isAtLeastAdmin,
		canManageEvents: isAtLeastAdmin,
		canManageTickets: isAtLeastAdmin,
		canManageVoting: isAtLeastAdmin,
		canWithdraw: isOwner,
		canManagePayouts: isOwner,
		// View flags
		canViewWallet: hasRole,
		canViewMembers: hasRole,
		canViewSettings: hasRole,
		canViewEvents: hasRole,
		hasActiveOrg: !!(orgContext?.activeOrgId ?? null),
	};
}

