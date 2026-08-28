"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { sendOrganizationInvitationEmail } from "../email/auth";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";

export async function inviteOrgMember({ data }: { data: any }): Promise<any> {
	const session = await requireSession();
	const email = data.email.toLowerCase().trim();
	const role = data.role || "member";
	const token = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

	// Check if already a team member
	const existingUser = await prisma.profile.findUnique({
		where: { email },
	});

	if (existingUser) {
		const existingMember = await prisma.teamMember.findUnique({
			where: {
				organizationId_userId: {
					organizationId: data.organizationId,
					userId: existingUser.id,
				},
			},
		});
		if (existingMember) {
			return {
				success: false,
				error: "This user is already a member of the organization.",
			};
		}
	}

	// Check if there's already a pending invitation
	const existingInvite = await prisma.organizationInvitation.findFirst({
		where: {
			organizationId: data.organizationId,
			email,
			status: "pending",
		},
	});

	let invite: any;
	if (existingInvite) {
		invite = await prisma.organizationInvitation.update({
			where: { id: existingInvite.id },
			data: {
				role,
				token,
				inviterId: session.userId,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});
	} else {
		invite = await prisma.organizationInvitation.create({
			data: {
				organizationId: data.organizationId,
				email,
				role,
				inviterId: session.userId,
				token,
				status: "pending",
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});
	}

	// Fetch org details for invitation email
	const org = await prisma.organization.findUnique({
		where: { id: data.organizationId },
		select: { name: true },
	});

	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const inviteUrl = `${appUrl}/invite/${token}`;

	// Send invitation email in background
	sendOrganizationInvitationEmail({
		email,
		organizationName: org?.name || "the organization",
		inviterName: session.fullName || undefined,
		role,
		inviteUrl,
	}).catch((err) => console.error("Error sending org invitation email:", err));

	revalidatePath("/organization/members");
	return { success: true, invitation: serializeJsonSafe(invite) };
}

export const inviteOrganizationMember = inviteOrgMember;

export async function removeOrgMember({ data }: { data: any }): Promise<any> {
	await requireSession();
	const id = data.id || data.memberId;
	const userId = data.targetUserId || data.userId;
	const orgId = data.organizationId;

	let whereClause: any;
	if (id) {
		whereClause = { id };
	} else if (orgId && userId) {
		whereClause = {
			organizationId_userId: {
				organizationId: orgId,
				userId: userId,
			},
		};
	} else {
		throw new Error("Member identifier is required to remove member.");
	}

	await prisma.teamMember.delete({ where: whereClause });
	revalidatePath("/organization/members");
	return { success: true };
}

export const removeTeamMember = removeOrgMember;

export async function updateMemberRole({ data }: { data: any }): Promise<any> {
	await requireSession();
	const id = data.id || data.memberId;
	const userId = data.targetUserId || data.userId;
	const orgId = data.organizationId;

	let whereClause: any;
	if (id) {
		whereClause = { id };
	} else if (orgId && userId) {
		whereClause = {
			organizationId_userId: {
				organizationId: orgId,
				userId: userId,
			},
		};
	} else {
		throw new Error("Member identifier is required to update role.");
	}

	const updated = await prisma.teamMember.update({
		where: whereClause,
		data: { role: data.role },
	});
	revalidatePath("/organization/members");
	return serializeJsonSafe(updated);
}

export const updateTeamMemberRole = updateMemberRole;

export async function cancelInvitation({ data }: { data: any }): Promise<any> {
	await requireSession();
	const id = data.id || data.invitationId;
	await prisma.organizationInvitation.delete({ where: { id } });
	revalidatePath("/organization/members");
	return { success: true };
}

export const cancelOrgInvitation = cancelInvitation;

export async function resendInvitation({ data }: { data: any }): Promise<any> {
	const session = await requireSession();
	const id = data.id || data.invitationId;
	const invite = await prisma.organizationInvitation.findUnique({
		where: { id },
		include: { organization: { select: { name: true } } },
	});

	if (!invite) throw new Error("Invitation not found");

	const token = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
	await prisma.organizationInvitation.update({
		where: { id: invite.id },
		data: {
			token,
			status: "pending",
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		},
	});

	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const inviteUrl = `${appUrl}/invite/${token}`;

	sendOrganizationInvitationEmail({
		email: invite.email,
		organizationName: invite.organization.name,
		inviterName: session.fullName || undefined,
		role: invite.role,
		inviteUrl,
	}).catch((err) => console.error("Error resending org invitation email:", err));

	revalidatePath("/organization/members");
	return { success: true };
}

export async function resolveMembershipRequest({
	data,
}: {
	data: any;
}): Promise<any> {
	const session = await requireSession();
	const request = await prisma.membershipRequest.findUnique({
		where: { id: data.requestId || data.id },
	});
	if (!request) throw new Error("Request not found");

	if (data.action === "approve" || data.approved) {
		await prisma.teamMember.create({
			data: {
				organizationId: request.organizationId,
				userId: request.userId,
				role: "member",
			},
		});
		await prisma.membershipRequest.update({
			where: { id: request.id },
			data: {
				status: "approved",
				resolvedBy: session.userId,
				resolvedAt: new Date(),
			},
		});
	} else {
		await prisma.membershipRequest.update({
			where: { id: request.id },
			data: {
				status: "rejected",
				resolvedBy: session.userId,
				resolvedAt: new Date(),
			},
		});
	}
	revalidatePath("/organization/members");
	return { success: true };
}

export const handleJoinRequest = resolveMembershipRequest;
