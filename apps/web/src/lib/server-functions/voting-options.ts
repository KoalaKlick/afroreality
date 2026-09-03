"use server";
import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { sendNominationConfirmationEmail } from "@/lib/email/nomination";

/**
 * Internal helper: Generate a 3-letter prefix based on nominee name
 */
function generateNomineePrefix(nomineeName: string): string {
	const clean = nomineeName.trim().replace(/[^a-zA-Z0-9\s]/g, "");
	const parts = clean.split(/\s+/).filter(Boolean);

	if (parts.length === 0) return "NOM";

	const initials = parts.map((p) => p[0]?.toUpperCase() ?? "X");

	if (initials.length >= 3) {
		return initials.slice(0, 3).join("");
	}
	if (initials.length === 2) {
		const lastName = parts[1] ?? "";
		const thirdChar = lastName.length > 1 ? (lastName[1]?.toUpperCase() ?? "X") : "X";
		return initials.join("") + thirdChar;
	}
	const singleName = (parts[0] ?? "").toUpperCase();
	return singleName.length >= 3 ? singleName.slice(0, 3) : singleName.padEnd(3, "X");
}

/**
 * Generate a unique nominee code for an event based on nominee name
 */
export async function generateNomineeCode(
	eventId: string,
	nomineeName: string,
): Promise<string> {
	try {
		const prefix = generateNomineePrefix(nomineeName);

		const options = await prisma.votingOption.findMany({
			where: {
				eventId,
				nomineeCode: { startsWith: prefix },
			},
			select: { nomineeCode: true },
		});

		let maxNumber = 0;
		const regex = new RegExp(`^${prefix}(\\d+)$`);
		for (const opt of options) {
			if (opt.nomineeCode) {
				const match = regex.exec(opt.nomineeCode);
				if (match && match[1]) {
					const num = Number.parseInt(match[1], 10);
					if (num > maxNumber) maxNumber = num;
				}
			}
		}

		const nextNumber = maxNumber + 1;
		return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
	} catch (error) {
		console.error("Error generating nominee code:", error);
		return `NOM${Date.now().toString().slice(-4)}`;
	}
}

/**
 * Organizer action: Add an approved nominee directly
 */
export async function createVotingOption({ data }: { data: any }): Promise<any> {
	await requireSession();
	const nomineeCode =
		data.nomineeCode || (await generateNomineeCode(data.eventId, data.optionText));

	const option = await prisma.votingOption.create({
		data: {
			eventId: data.eventId,
			categoryId: data.categoryId,
			optionText: data.optionText.trim(),
			description: data.description || null,
			imageUrl: data.imageUrl || null,
			nomineeCode,
			status: "approved",
			isPublicNomination: false,
		},
	});
	revalidatePath(`/my-events/${data.eventId}`);
	return serializeJsonSafe(option);
}

export async function updateVotingOption({ data }: { data: any }): Promise<any> {
	await requireSession();
	const { id, ...rest } = data;
	const updated = await prisma.votingOption.update({
		where: { id: id || data.optionId },
		data: rest,
	});
	return serializeJsonSafe(updated);
}

export async function updateVotingOptionStatus({
	data,
}: {
	data: { id?: string; optionId?: string; status: any };
}): Promise<any> {
	await requireSession();
	const targetId = data.id || data.optionId;
	if (!targetId) throw new Error("Missing option id");
	const updated = await prisma.votingOption.update({
		where: { id: targetId },
		data: { status: data.status },
	});
	return serializeJsonSafe(updated);
}

export async function deleteVotingOption({ data }: { data: any }): Promise<any> {
	await requireSession();
	const targetId = data.id || data.optionId;
	await prisma.votingOption.delete({ where: { id: targetId } });
	return { success: true };
}

export async function approveNomination({ data }: { data: any }): Promise<any> {
	await requireSession();
	const targetId = data.id || data.optionId;
	if (!targetId) throw new Error("Missing option id");

	const option = await prisma.votingOption.findUnique({
		where: { id: targetId },
		include: {
			category: true,
			event: { include: { organization: true } },
		},
	});

	if (!option) throw new Error("Nomination not found");

	const deletionCode =
		option.deletionCode || Math.floor(100000 + Math.random() * 900000).toString();

	const updated = await prisma.votingOption.update({
		where: { id: targetId },
		data: {
			status: "approved",
			deletionCode,
		},
	});

	// Send approval email notification if recipient email exists
	const recipientEmail = option.nominatedByEmail || option.email;
	if (recipientEmail) {
		sendNominationConfirmationEmail({
			email: recipientEmail,
			recipientName: option.nominatedByName || recipientEmail,
			nomineeName: option.optionText,
			categoryName: option.category?.name || "Category",
			eventName: option.event?.title || "Event",
			deletionCode,
			organizationName: option.event?.organization?.name || "Fextiva",
			bannerUrl: option.event?.bannerImage || option.event?.flierImage,
		}).catch((err) => console.error("[voting] Failed to send approval email:", err));
	}

	return serializeJsonSafe(updated);
}

export async function rejectNomination({ data }: { data: any }): Promise<any> {
	return updateVotingOptionStatus({ data: { ...data, status: "rejected" } });
}

export async function getSuggestedNomineeCode({
	data,
}: {
	data: any;
}): Promise<{ code: string }> {
	if (data.optionText) {
		const code = await generateNomineeCode(data.eventId, data.optionText);
		return { code };
	}
	const count = await prisma.votingOption.count({
		where: { categoryId: data.categoryId },
	});
	return { code: `NOM${String(count + 1).padStart(3, "0")}` };
}

/**
 * Public action: Submit a free public nomination directly
 */
export async function submitPublicNomination({
	data,
}: {
	data: {
		eventId: string;
		categoryId: string;
		optionText: string;
		email?: string;
		description?: string;
		imageUrl?: string;
		nominatorName?: string;
		nominatorEmail?: string;
	};
}): Promise<any> {
	if (!data.optionText?.trim()) {
		return { success: false, error: "Nominee name is required." };
	}

	const category = await prisma.votingCategory.findUnique({
		where: { id: data.categoryId },
		include: {
			event: {
				include: { organization: true },
			},
		},
	});

	if (!category || category.eventId !== data.eventId) {
		return { success: false, error: "Category not found." };
	}

	if (!category.allowPublicNomination) {
		return {
			success: false,
			error: "This category does not accept public nominations.",
		};
	}

	if (
		category.nominationDeadline &&
		new Date() > new Date(category.nominationDeadline)
	) {
		return { success: false, error: "Nomination deadline has passed." };
	}

	const nominationPrice = Number(category.nominationPrice || 0);
	if (nominationPrice > 0) {
		return {
			success: false,
			error: `This nomination requires a fee of GHS ${nominationPrice.toFixed(2)}. Please complete payment.`,
		};
	}

	const requireApproval = category.requireApproval ?? true;
	const status = requireApproval ? "pending" : "approved";
	const nomineeCode = await generateNomineeCode(data.eventId, data.optionText);
	const deletionCode = Math.floor(100000 + Math.random() * 900000).toString();

	const option = await prisma.votingOption.create({
		data: {
			eventId: data.eventId,
			categoryId: data.categoryId,
			optionText: data.optionText.trim(),
			email: data.email?.trim() || null,
			description: data.description?.trim() || null,
			imageUrl: data.imageUrl || null,
			nominatedByName: data.nominatorName?.trim() || null,
			nominatedByEmail: data.nominatorEmail?.trim() || null,
			nomineeCode,
			status,
			isPublicNomination: true,
			deletionCode,
		},
	});

	// Fire confirmation email
	const recipientEmail = data.nominatorEmail?.trim() || data.email?.trim();
	if (recipientEmail) {
		sendNominationConfirmationEmail({
			email: recipientEmail,
			recipientName: data.nominatorName?.trim() || recipientEmail,
			nomineeName: data.optionText.trim(),
			categoryName: category.name,
			eventName: category.event.title,
			deletionCode: status === "approved" ? deletionCode : null,
			organizationName: category.event.organization?.name || "Fextiva",
			bannerUrl: category.event.bannerImage || category.event.flierImage,
		}).catch((err) =>
			console.error("[voting] Failed to send free nomination confirmation email:", err),
		);
	}

	return {
		success: true,
		data: serializeJsonSafe({
			id: option.id,
			nomineeCode: option.nomineeCode,
			status: option.status,
		}),
	};
}

/**
 * Public action: Withdraw/delete a public nomination using the exit key (deletionCode)
 */
export async function withdrawNominationWithKey({
	data,
}: {
	data: { optionId: string; deletionCode: string };
}): Promise<{ success: boolean; error?: string }> {
	const { optionId, deletionCode } = data;
	if (!optionId || !deletionCode?.trim()) {
		return { success: false, error: "Option ID and exit key are required." };
	}

	const option = await prisma.votingOption.findUnique({
		where: { id: optionId },
	});

	if (!option) {
		return { success: false, error: "Nominee not found." };
	}

	if (!option.deletionCode || option.deletionCode !== deletionCode.trim()) {
		return { success: false, error: "Invalid nomination exit key." };
	}

	await prisma.votingOption.delete({
		where: { id: optionId },
	});

	return { success: true };
}
