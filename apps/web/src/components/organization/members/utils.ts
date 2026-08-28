// src/components/organization/members/utils.ts

export type InvitationStatus =
	| "pending"
	| "accepted"
	| "declined"
	| "expired"
	| "cancelled";

export function getEffectiveStatus(
	status: string,
	expiresAt: string | null,
): string {
	if (status === "pending" && expiresAt && new Date(expiresAt) < new Date()) {
		return "expired";
	}
	return status;
}
