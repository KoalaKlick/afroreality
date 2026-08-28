"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { getSession, requireSession, setSessionCookie, signSession } from "../session";
import { serializeJsonSafe } from "../utils";

function isUuid(str: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		str,
	);
}

export async function acceptOrgInvitation({
	data,
}: {
	data: any;
}): Promise<any> {
	const session = await requireSession();
	const token = data.token || data.invitationId;
	if (!token) throw new Error("Invitation token is required.");

	const whereCondition: any = isUuid(token)
		? { OR: [{ token: token }, { id: token }], status: "pending" }
		: { token: token, status: "pending" };

	const invite = await prisma.organizationInvitation.findFirst({
		where: whereCondition,
		include: { organization: true },
	});
	if (!invite)
		throw new Error(
			"Invitation not found or has already been accepted/expired.",
		);

	// Check if already a member
	const existing = await prisma.teamMember.findUnique({
		where: {
			organizationId_userId: {
				organizationId: invite.organizationId,
				userId: session.userId,
			},
		},
	});

	if (!existing) {
		await prisma.teamMember.create({
			data: {
				organizationId: invite.organizationId,
				userId: session.userId,
				role: invite.role,
			},
		});
	}

	await prisma.organizationInvitation.update({
		where: { id: invite.id },
		data: {
			status: "accepted",
			respondedAt: new Date(),
		},
	});

	// Mark onboarding as completed for this user since they are now part of an organization
	await prisma.profile.update({
		where: { id: session.userId },
		data: {
			onboardingCompleted: true,
			onboardingStep: 3,
		},
	}).catch(() => null);

	// Refresh the session cookie with onboardingCompleted = true
	try {
		const updatedToken = await signSession({
			...session,
			onboardingCompleted: true,
		});
		await setSessionCookie(updatedToken);
	} catch {
		// Ignore if cookie cannot be updated in current execution environment
	}

	revalidatePath("/organization/members");
	revalidatePath("/dashboard");
	return { success: true, organizationId: invite.organizationId };
}

export const acceptInvitation = acceptOrgInvitation;

export async function declineOrgInvitation({
	data,
}: {
	data: any;
}): Promise<any> {
	await requireSession();
	const token = data.token || data.invitationId;
	if (!token) return { success: true };

	const whereCondition: any = isUuid(token)
		? { OR: [{ token: token }, { id: token }] }
		: { token: token };

	const invite = await prisma.organizationInvitation.findFirst({
		where: whereCondition,
	});
	if (invite) {
		await prisma.organizationInvitation.update({
			where: { id: invite.id },
			data: {
				status: "declined",
				respondedAt: new Date(),
			},
		});
	}
	revalidatePath("/organization/members");
	return { success: true };
}

export const declineInvitation = declineOrgInvitation;

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

export async function getPendingInvitationsForEmail(): Promise<any[]> {
	try {
		const session = await getSession();
		if (!session || !session.email) return [];
		const invites = await prisma.organizationInvitation.findMany({
			where: {
				email: session.email.toLowerCase().trim(),
				status: "pending",
				expiresAt: { gt: new Date() },
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
						bannerUrl: true,
					},
				},
				inviter: {
					select: {
						id: true,
						fullName: true,
						avatarUrl: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
		return serializeJsonSafe(invites);
	} catch {
		return [];
	}
}

export async function getInvitationByToken(token: string): Promise<any> {
	if (!token) return null;

	const whereCondition: any = isUuid(token)
		? { OR: [{ token: token }, { id: token }] }
		: { token: token };

	const invite = await prisma.organizationInvitation.findFirst({
		where: whereCondition,
		include: {
			organization: {
				select: {
					id: true,
					name: true,
					slug: true,
					logoUrl: true,
					bannerUrl: true,
					primaryColor: true,
					secondaryColor: true,
				},
			},
			inviter: {
				select: {
					id: true,
					fullName: true,
					email: true,
					avatarUrl: true,
				},
			},
		},
	});

	if (!invite) return null;

	// Check if this invitee email already has an account
	const existingProfile = await prisma.profile.findUnique({
		where: { email: invite.email.toLowerCase().trim() },
		select: { id: true, fullName: true, avatarUrl: true },
	});

	return serializeJsonSafe({
		...invite,
		organizationName: invite.organization.name,
		organizationLogo: invite.organization.logoUrl,
		organizationBanner: invite.organization.bannerUrl,
		userExists: !!existingProfile,
		existingUserName: existingProfile?.fullName || null,
	});
}
