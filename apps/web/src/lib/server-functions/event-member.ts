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

export async function getEventMembers({ data }: { data: any }): Promise<any> {
	const members = await prisma.eventMember.findMany({
		where: { eventId: data.eventId },
		orderBy: { createdAt: "desc" },
	});
	return { items: serializeJsonSafe(members), total: members.length };
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
			email: data.email || null,
			phone: data.phone || null,
			uniqueCode,
			status: "invited",
			responses: data.responses || undefined,
		},
	});

	// If member has email, dispatch voting key email with org branding
	if (member.email) {
		const event = await prisma.event.findUnique({
			where: { id: data.eventId },
			include: { organization: true },
		});
		if (event) {
			const appUrl =
				process.env.NEXT_PUBLIC_APP_URL ||
				process.env.NEXT_PUBLIC_DOMAIN_URL ||
				"";
			const votingUrl = `${appUrl}/events/${event.slug || event.id}`;
			await sendEventVotingKeyEmail({
				email: member.email,
				name: member.name,
				eventName: event.title,
				organizationName: event.organization.name,
				organizationBannerUrl: event.organization.bannerUrl,
				organizationLogoUrl: event.organization.logoUrl,
				votingKey: member.uniqueCode,
				votingUrl,
			}).catch(() => null);
		}
	}

	revalidatePath(`/my-events/${data.eventId}`);
	return serializeJsonSafe(member);
}

export async function bulkAddEventMembers({
	data,
}: {
	data: any;
}): Promise<any> {
	const membersData = (data.members || []).map((m: any) => ({
		eventId: data.eventId,
		name: m.name,
		email: m.email || null,
		phone: m.phone || null,
		uniqueCode: generateVoterKey(),
		status: "invited",
		responses: m.responses || undefined,
	}));

	await prisma.eventMember.createMany({
		data: membersData,
		skipDuplicates: true,
	});

	// Dispatch emails in background for members with email
	const event = await prisma.event.findUnique({
		where: { id: data.eventId },
		include: { organization: true },
	});

	if (event) {
		const appUrl =
			process.env.NEXT_PUBLIC_APP_URL ||
			process.env.NEXT_PUBLIC_DOMAIN_URL ||
			"";
		const votingUrl = `${appUrl}/events/${event.slug || event.id}`;

		const createdMembers = await prisma.eventMember.findMany({
			where: {
				eventId: data.eventId,
				email: { not: null },
			},
		});

		await Promise.all(
			createdMembers.map((m) => {
				if (!m.email) return Promise.resolve(null);
				return sendEventVotingKeyEmail({
					email: m.email,
					name: m.name,
					eventName: event.title,
					organizationName: event.organization.name,
					organizationBannerUrl: event.organization.bannerUrl,
					organizationLogoUrl: event.organization.logoUrl,
					votingKey: m.uniqueCode,
					votingUrl,
				}).catch(() => null);
			}),
		);
	}

	revalidatePath(`/my-events/${data.eventId}`);
	return { success: true, added: membersData.length };
}

export async function publicRegisterForEvent({
	data,
}: {
	data: any;
}): Promise<any> {
	return addEventMember({ data });
}

export async function markAttendance({ data }: { data: any }): Promise<any> {
	const updated = await prisma.eventMember.update({
		where: { id: data.id || data.memberId },
		data: { attended: data.attended ?? true },
	});
	return serializeJsonSafe(updated);
}

export async function removeEventMember({
	data,
}: {
	data: any;
}): Promise<any> {
	const memberId = data.id || data.memberId;
	const member = await prisma.eventMember.findUnique({
		where: { id: memberId },
		include: { event: true },
	});
	if (!member) throw new Error("Member not found.");

	// Block deletion if voting has started or votes exist for this event
	const votesCount = await prisma.vote.count({
		where: { eventId: member.eventId },
	});

	const statusStr = String(member.event.status);
	const isVotingLive =
		statusStr === "live" ||
		statusStr === "ongoing" ||
		statusStr === "published" ||
		(member.event.startDate && new Date(member.event.startDate) <= new Date());

	if (votesCount > 0 || (isVotingLive && member.event.type === "voting")) {
		throw new Error(
			"Cannot remove members once voting has started to maintain election integrity.",
		);
	}

	await prisma.eventMember.delete({
		where: { id: memberId },
	});
	revalidatePath(`/my-events/${member.eventId}`);
	return { success: true };
}

export async function bulkMarkAttendance({
	data,
}: {
	data: any;
}): Promise<any> {
	await prisma.eventMember.updateMany({
		where: { id: { in: data.memberIds || data.ids } },
		data: { attended: data.attended ?? true },
	});
	return { success: true };
}

export async function bulkRemoveEventMembers({
	data,
}: {
	data: any;
}): Promise<any> {
	const memberIds = data.memberIds || data.ids || [];
	if (memberIds.length === 0) return { success: true };

	const firstMember = await prisma.eventMember.findUnique({
		where: { id: memberIds[0] },
		include: { event: true },
	});
	if (firstMember) {
		const votesCount = await prisma.vote.count({
			where: { eventId: firstMember.eventId },
		});
		const statusStr = String(firstMember.event.status);
		const isVotingLive =
			statusStr === "live" ||
			statusStr === "ongoing" ||
			statusStr === "published" ||
			(firstMember.event.startDate &&
				new Date(firstMember.event.startDate) <= new Date());

		if (
			votesCount > 0 ||
			(isVotingLive && firstMember.event.type === "voting")
		) {
			throw new Error(
				"Cannot remove members once voting has started to maintain election integrity.",
			);
		}
	}

	await prisma.eventMember.deleteMany({
		where: { id: { in: memberIds } },
	});
	if (firstMember) revalidatePath(`/my-events/${firstMember.eventId}`);
	return { success: true };
}

export async function sendCodes({ data }: { data: any }): Promise<any> {
	const event = await prisma.event.findUnique({
		where: { id: data.eventId },
		include: { organization: true },
	});
	if (!event) throw new Error("Event not found");

	const members = await prisma.eventMember.findMany({
		where: {
			eventId: data.eventId,
			email: { not: null },
		},
	});

	if (members.length === 0) {
		return { success: true, sent: 0, total: 0 };
	}

	const appUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.NEXT_PUBLIC_DOMAIN_URL ||
		"";
	const votingUrl = `${appUrl}/events/${event.slug || event.id}`;

	let sentCount = 0;
	await Promise.all(
		members.map(async (member) => {
			if (!member.email) return;
			const res = await sendEventVotingKeyEmail({
				email: member.email,
				name: member.name,
				eventName: event.title,
				organizationName: event.organization.name,
				organizationBannerUrl: event.organization.bannerUrl,
				organizationLogoUrl: event.organization.logoUrl,
				votingKey: member.uniqueCode,
				votingUrl,
			});
			if (res.success) sentCount++;
		}),
	);

	return { success: true, sent: sentCount, total: members.length };
}

export async function sendSingleCode({ data }: { data: any }): Promise<any> {
	const member = await prisma.eventMember.findUnique({
		where: { id: data.memberId },
		include: {
			event: {
				include: { organization: true },
			},
		},
	});
	if (!member || !member.email) {
		throw new Error("Member with email not found");
	}

	const appUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.NEXT_PUBLIC_DOMAIN_URL ||
		"";
	const votingUrl = `${appUrl}/events/${member.event.slug || member.event.id}`;

	const res = await sendEventVotingKeyEmail({
		email: member.email,
		name: member.name,
		eventName: member.event.title,
		organizationName: member.event.organization.name,
		organizationBannerUrl: member.event.organization.bannerUrl,
		organizationLogoUrl: member.event.organization.logoUrl,
		votingKey: member.uniqueCode,
		votingUrl,
	});

	return res;
}
