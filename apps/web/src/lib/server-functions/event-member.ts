"use server";

import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { sendEventVotingKeyEmail } from "@/lib/email/auth";
import { serializeJsonSafe } from "../utils";

function generateVoterKey(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let part1 = "";
	let part2 = "";
	for (let i = 0; i < 4; i++) {
		part1 += chars.charAt(Math.floor(Math.random() * chars.length));
		part2 += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return `${part1}-${part2}`;
}

export async function getEventMembers({
	data,
}: {
	data: {
		eventId: string;
		page?: number;
		pageSize?: number;
		limit?: number;
		search?: string;
	};
}): Promise<any> {
	const where: any = { eventId: data.eventId };
	if (data.search) {
		where.OR = [
			{ name: { contains: data.search, mode: "insensitive" } },
			{ email: { contains: data.search, mode: "insensitive" } },
			{ phone: { contains: data.search, mode: "insensitive" } },
		];
	}

	const [members, total] = await Promise.all([
		prisma.eventMember.findMany({
			where,
			orderBy: { createdAt: "desc" },
		}),
		prisma.eventMember.count({ where }),
	]);

	return { items: serializeJsonSafe(members), total };
}

export async function addEventMember({ data }: { data: any }): Promise<any> {
	let uniqueCode = generateVoterKey();
	let exists = await prisma.eventMember.findUnique({
		where: { uniqueCode },
	});
	while (exists) {
		uniqueCode = generateVoterKey();
		exists = await prisma.eventMember.findUnique({
			where: { uniqueCode },
		});
	}

	const member = await prisma.eventMember.create({
		data: {
			eventId: data.eventId,
			name: data.name,
			email: data.email,
			phone: data.phone,
			uniqueCode,
			status: "invited",
		},
	});

	if (data.sendEmail && data.email) {
		const event = await prisma.event.findUnique({
			where: { id: data.eventId },
			include: { organization: true },
		});
		if (event) {
			await sendEventVotingKeyEmail({
				email: data.email,
				name: data.name || "Member",
				eventName: event.title,
				votingKey: uniqueCode,
				organizationName: event.organization.name,
				organizationBannerUrl: event.organization.bannerUrl,
				organizationLogoUrl: event.organization.logoUrl,
			});
		}
	}

	return serializeJsonSafe(member);
}

export async function bulkAddEventMembers({
	data,
}: {
	data: {
		eventId: string;
		members: Array<{ name: string; email?: string; phone?: string }>;
		sendEmail?: boolean;
	};
}): Promise<any> {
	const event = await prisma.event.findUnique({
		where: { id: data.eventId },
		include: { organization: true },
	});

	const created = [];
	for (const m of data.members) {
		let uniqueCode = generateVoterKey();
		let exists = await prisma.eventMember.findUnique({
			where: { uniqueCode },
		});
		while (exists) {
			uniqueCode = generateVoterKey();
			exists = await prisma.eventMember.findUnique({
				where: { uniqueCode },
			});
		}

		const member = await prisma.eventMember.create({
			data: {
				eventId: data.eventId,
				name: m.name,
				email: m.email,
				phone: m.phone,
				uniqueCode,
				status: "invited",
			},
		});
		created.push(member);

		if (data.sendEmail && m.email && event) {
			sendEventVotingKeyEmail({
				email: m.email,
				name: m.name || "Member",
				eventName: event.title,
				votingKey: uniqueCode,
				organizationName: event.organization.name,
				organizationBannerUrl: event.organization.bannerUrl,
				organizationLogoUrl: event.organization.logoUrl,
			}).catch(console.error);
		}
	}

	return { count: created.length, items: serializeJsonSafe(created) };
}

export async function sendSingleCode({
	data,
}: {
	data: { id?: string; memberId?: string; eventId?: string };
}): Promise<any> {
	const targetId = data.id || data.memberId;
	if (!targetId) throw new Error("Missing member ID");

	const member = await prisma.eventMember.findUnique({
		where: { id: targetId },
		include: {
			event: {
				include: { organization: true },
			},
		},
	});

	if (!member || !member.email) {
		throw new Error("Member not found or missing email address.");
	}

	await sendEventVotingKeyEmail({
		email: member.email,
		name: member.name || "Member",
		eventName: member.event.title,
		votingKey: member.uniqueCode,
		organizationName: member.event.organization.name,
		organizationBannerUrl: member.event.organization.bannerUrl,
		organizationLogoUrl: member.event.organization.logoUrl,
	});

	return { success: true };
}

export async function sendCodes({
	data,
}: {
	data: { eventId: string; memberIds?: string[] };
}): Promise<any> {
	const event = await prisma.event.findUnique({
		where: { id: data.eventId },
		include: { organization: true },
	});

	if (!event) throw new Error("Event not found.");

	const where: any = {
		eventId: data.eventId,
		email: { not: null },
	};
	if (data.memberIds && data.memberIds.length > 0) {
		where.id = { in: data.memberIds };
	}

	const members = await prisma.eventMember.findMany({ where });

	for (const m of members) {
		if (m.email) {
			sendEventVotingKeyEmail({
				email: m.email,
				name: m.name || "Member",
				eventName: event.title,
				votingKey: m.uniqueCode,
				organizationName: event.organization.name,
				organizationBannerUrl: event.organization.bannerUrl,
				organizationLogoUrl: event.organization.logoUrl,
			}).catch(console.error);
		}
	}

	return { success: true, count: members.length };
}

export async function markAttendance({
	data,
}: {
	data: {
		id?: string;
		memberId?: string;
		eventId?: string;
		uniqueCode?: string;
		status?: "attended" | "invited" | "voted";
	};
}): Promise<any> {
	if (data.uniqueCode) {
		const member = await prisma.eventMember.findFirst({
			where: {
				uniqueCode: data.uniqueCode,
				...(data.eventId ? { eventId: data.eventId } : {}),
			},
		});
		if (!member) throw new Error("Invalid member voter code.");
		const updated = await prisma.eventMember.update({
			where: { id: member.id },
			data: { status: data.status || "attended" },
		});
		return serializeJsonSafe(updated);
	}

	const targetId = data.id || data.memberId;
	if (!targetId) throw new Error("Missing member ID");

	const updated = await prisma.eventMember.update({
		where: { id: targetId },
		data: { status: data.status || "attended" },
	});
	return serializeJsonSafe(updated);
}

export async function bulkMarkAttendance({
	data,
}: {
	data: {
		ids?: string[];
		memberIds?: string[];
		eventId?: string;
		status?: "attended" | "invited" | "voted";
	};
}): Promise<any> {
	const targetIds = data.ids || data.memberIds || [];
	if (targetIds.length === 0) return { success: true, count: 0 };

	await prisma.eventMember.updateMany({
		where: { id: { in: targetIds } },
		data: { status: data.status || "attended" },
	});
	return { success: true, count: targetIds.length };
}

export async function removeEventMember({
	data,
}: {
	data: { id?: string; memberId?: string; eventId?: string };
}): Promise<any> {
	const targetId = data.id || data.memberId;
	if (!targetId) throw new Error("Missing member ID");

	const member = await prisma.eventMember.findUnique({
		where: { id: targetId },
	});

	if (!member) return { success: true };

	const eventId = data.eventId || member.eventId;
	const votesCount = await prisma.vote.count({
		where: { eventId },
	});

	if (votesCount > 0) {
		throw new Error(
			"Cannot remove member. Electoral member list is locked once voting has started.",
		);
	}

	if (member.status === "voted") {
		throw new Error("Cannot remove a member who has already cast a vote.");
	}

	await prisma.eventMember.delete({
		where: { id: targetId },
	});

	return { success: true };
}

export async function bulkRemoveEventMembers({
	data,
}: {
	data: { ids?: string[]; memberIds?: string[]; eventId?: string };
}): Promise<any> {
	const targetIds = data.ids || data.memberIds || [];
	if (targetIds.length === 0) return { success: true };

	if (data.eventId) {
		const votesCount = await prisma.vote.count({
			where: { eventId: data.eventId },
		});

		if (votesCount > 0) {
			throw new Error(
				"Cannot remove members. Electoral member list is locked once voting has started.",
			);
		}
	}

	await prisma.eventMember.deleteMany({
		where: {
			id: { in: targetIds },
			status: { not: "voted" },
		},
	});

	return { success: true };
}

export async function publicRegisterForEvent({
	data,
}: {
	data: { eventId: string; name: string; email: string; phone?: string };
}): Promise<any> {
	return registerEventMemberPublic({ data });
}

export async function registerEventMemberPublic({
	data,
}: {
	data: { eventId: string; name: string; email: string; phone?: string };
}): Promise<any> {
	let uniqueCode = generateVoterKey();
	let exists = await prisma.eventMember.findUnique({
		where: { uniqueCode },
	});
	while (exists) {
		uniqueCode = generateVoterKey();
		exists = await prisma.eventMember.findUnique({
			where: { uniqueCode },
		});
	}

	const member = await prisma.eventMember.create({
		data: {
			eventId: data.eventId,
			name: data.name,
			email: data.email,
			phone: data.phone,
			uniqueCode,
			status: "invited",
		},
	});

	if (data.email) {
		const event = await prisma.event.findUnique({
			where: { id: data.eventId },
			include: { organization: true },
		});
		if (event) {
			await sendEventVotingKeyEmail({
				email: data.email,
				name: data.name || "Member",
				eventName: event.title,
				votingKey: uniqueCode,
				organizationName: event.organization.name,
				organizationBannerUrl: event.organization.bannerUrl,
				organizationLogoUrl: event.organization.logoUrl,
			});
		}
	}

	return {
		success: true,
		uniqueCode,
		member: serializeJsonSafe(member),
	};
}
