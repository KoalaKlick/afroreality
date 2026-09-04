"use server";
import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe } from "../utils";
import { sendNominationConfirmationEmail } from "@/lib/email/nomination";
import { extractCategoryPrefix } from "@/lib/utils/nominee-code";

/**
 * Generate a unique nominee code for an event based on category initials + 2-digit sequence
 * e.g., "Best Male Artist" -> "BMA01", "BMA02"
 */
export async function generateNomineeCode(
	eventId: string,
	categoryIdOrName?: string | null,
	fallbackText?: string | null,
): Promise<string> {
	let resolvedCategoryName: string | null = null;

	try {
		if (categoryIdOrName) {
			// Check if categoryIdOrName is a category ID in database
			const category = await prisma.votingCategory.findUnique({
				where: { id: categoryIdOrName },
				select: { name: true },
			});
			resolvedCategoryName = category?.name ?? categoryIdOrName;
		} else if (fallbackText) {
			resolvedCategoryName = fallbackText;
		}

		const prefix = extractCategoryPrefix(resolvedCategoryName);

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
		return `${prefix}${nextNumber.toString().padStart(2, "0")}`;
	} catch (error) {
		console.error("Error generating nominee code:", error);
		const prefix = extractCategoryPrefix(resolvedCategoryName || categoryIdOrName || fallbackText);
		return `${prefix}01`;
	}
}

/**
 * Organizer action: Add an approved nominee directly
 */
export async function createVotingOption({ data }: { data: any }): Promise<any> {
	await requireSession();
	const eventId = data.eventId;
	let nomineeCode = data.nomineeCode?.trim();

	if (nomineeCode) {
		const existing = await prisma.votingOption.findFirst({
			where: {
				eventId,
				nomineeCode,
			},
			select: { id: true },
		});
		if (existing) {
			throw new Error(
				`Nominee code "${nomineeCode}" is already taken for this event. Please choose a different code or leave it blank to auto-generate.`
			);
		}
	} else {
		nomineeCode = await generateNomineeCode(eventId, data.categoryId, data.optionText);
	}

	try {
		const option = await prisma.votingOption.create({
			data: {
				eventId: data.eventId,
				categoryId: data.categoryId,
				optionText: data.optionText.trim(),
				email: data.email?.trim() || null,
				description: data.description || null,
				imageUrl: data.imageUrl || null,
				nomineeCode,
				status: "approved",
				isPublicNomination: false,
			},
		});
		revalidatePath(`/my-events/${data.eventId}`);
		return serializeJsonSafe(option);
	} catch (error: any) {
		const errStr = String(error?.message || error?.meta?.driverAdapterError || error);
		if (
			error?.code === "P2002" ||
			errStr.includes("P2002") ||
			errStr.includes("UniqueConstraintViolation") ||
			errStr.includes("nominee_code")
		) {
			throw new Error(
				`Nominee code "${nomineeCode}" is already taken for this event. Please choose a different code or leave it blank to auto-generate.`
			);
		}
		throw error;
	}
}

export async function updateVotingOption({ data }: { data: any }): Promise<any> {
	await requireSession();
	const { id, ...rest } = data;
	const targetId = id || data.optionId;
	if (!targetId) throw new Error("Missing option id");

	const newCode = rest.nomineeCode?.trim();
	if (newCode) {
		const current = await prisma.votingOption.findUnique({
			where: { id: targetId },
			select: { eventId: true },
		});

		if (current?.eventId) {
			const existing = await prisma.votingOption.findFirst({
				where: {
					eventId: current.eventId,
					nomineeCode: newCode,
					id: { not: targetId },
				},
				select: { id: true },
			});
			if (existing) {
				throw new Error(
					`Nominee code "${newCode}" is already assigned to another nominee in this event.`
				);
			}
		}
	}

	try {
		const updated = await prisma.votingOption.update({
			where: { id: targetId },
			data: {
				...rest,
				...(rest.email !== undefined ? { email: rest.email?.trim() || null } : {}),
				...(newCode ? { nomineeCode: newCode } : {}),
			},
		});
		return serializeJsonSafe(updated);
	} catch (error: any) {
		const errStr = String(error?.message || error?.meta?.driverAdapterError || error);
		if (
			error?.code === "P2002" ||
			errStr.includes("P2002") ||
			errStr.includes("UniqueConstraintViolation") ||
			errStr.includes("nominee_code")
		) {
			throw new Error(
				`Nominee code "${newCode || "provided"}" is already assigned to another nominee in this event. Please enter a unique code.`
			);
		}
		throw error;
	}
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
	if (!targetId) throw new Error("Missing option id");

	const option = await prisma.votingOption.findUnique({
		where: { id: targetId },
		select: { id: true, deletionCode: true, votesCount: true, optionText: true },
	});

	if (!option) return { success: true };

	// Highest constraint: Nominees with recorded votes CANNOT be deleted under any circumstance
	const voteRecordCount = await prisma.vote.count({ where: { optionId: targetId } });
	const totalVotes = Math.max(Number(option.votesCount || 0), voteRecordCount);
	if (totalVotes > 0) {
		throw new Error(
			`Cannot delete "${option.optionText}" because they have already received ${totalVotes.toLocaleString()} vote${totalVotes > 1 ? "s" : ""}. To preserve contest integrity, nominees with votes cannot be removed.`,
		);
	}

	// If this nominee has an exit key (paid nomination), verify the nominator's exit key
	if (option.deletionCode) {
		const code = data.deletionCode || data.code;
		if (!code || code.trim() !== option.deletionCode.trim()) {
			throw new Error(
				"Invalid exit key. This paid nomination requires the nominator's exit key to delete.",
			);
		}
	}

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

	// For free nominations, do not generate an exit key; only preserve if already set on paid nominations
	const isPaidNomination = Number(option.category?.nominationPrice || 0) > 0;
	const deletionCode = isPaidNomination ? (option.deletionCode || null) : null;

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
			status: "approved",
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

export async function resendNominationEmail({
	data,
}: {
	data: { optionId: string };
}): Promise<{ success: boolean; error?: string }> {
	await requireSession();
	const targetId = data.optionId;
	if (!targetId) return { success: false, error: "Missing nomination option ID" };

	const option = await prisma.votingOption.findUnique({
		where: { id: targetId },
		include: {
			category: true,
			event: { include: { organization: true } },
		},
	});

	if (!option) return { success: false, error: "Nomination not found" };

	const recipientEmail = option.nominatedByEmail || option.email;
	if (!recipientEmail) {
		return { success: false, error: "No recipient email found on this nomination" };
	}

	const isLive = option.status === "approved";
	const isPaidNomination = Number(option.category?.nominationPrice || 0) > 0;
	const deletionCode = isLive && isPaidNomination ? (option.deletionCode || null) : null;

	const res = await sendNominationConfirmationEmail({
		email: recipientEmail,
		recipientName: option.nominatedByName || recipientEmail,
		nomineeName: option.optionText,
		categoryName: option.category?.name || "Category",
		eventName: option.event?.title || "Event",
		status: option.status,
		deletionCode,
		organizationName: option.event?.organization?.name || "Fextiva",
		bannerUrl: option.event?.bannerImage || option.event?.flierImage,
	});

	if (!res.success) {
		return { success: false, error: res.error || "Failed to send email" };
	}

	return { success: true };
}

export async function getSuggestedNomineeCode({
	data,
}: {
	data: any;
}): Promise<{ code: string }> {
	const code = await generateNomineeCode(
		data.eventId,
		data.categoryId,
		data.optionText,
	);
	return { code };
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
	const nomineeCode = await generateNomineeCode(data.eventId, data.categoryId, category.name);

	try {
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
				deletionCode: null, // Free nomination: no exit key needed
			},
		});

		// Fire confirmation email without exit key
		const recipientEmail = data.nominatorEmail?.trim() || data.email?.trim();
		if (recipientEmail) {
			sendNominationConfirmationEmail({
				email: recipientEmail,
				recipientName: data.nominatorName?.trim() || recipientEmail,
				nomineeName: data.optionText.trim(),
				categoryName: category.name,
				eventName: category.event.title,
				status,
				deletionCode: null,
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
	} catch (error: any) {
		const errStr = String(error?.message || error?.meta?.driverAdapterError || error);
		if (
			error?.code === "P2002" ||
			errStr.includes("P2002") ||
			errStr.includes("UniqueConstraintViolation") ||
			errStr.includes("nominee_code")
		) {
			return {
				success: false,
				error: "A nominee with this code already exists. Please try submitting again.",
			};
		}
		return {
			success: false,
			error: error?.message || "Failed to submit nomination.",
		};
	}
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
		select: { id: true, deletionCode: true, votesCount: true, optionText: true },
	});

	if (!option) {
		return { success: false, error: "Nominee not found." };
	}

	// Highest constraint: Nominees with recorded votes CANNOT be withdrawn
	const voteRecordCount = await prisma.vote.count({ where: { optionId } });
	const totalVotes = Math.max(Number(option.votesCount || 0), voteRecordCount);
	if (totalVotes > 0) {
		return {
			success: false,
			error: `Cannot withdraw "${option.optionText}" because they have already received ${totalVotes.toLocaleString()} vote${totalVotes > 1 ? "s" : ""}. Nominees with recorded votes cannot be withdrawn once voting has commenced.`,
		};
	}

	if (!option.deletionCode || option.deletionCode !== deletionCode.trim()) {
		return { success: false, error: "Invalid nomination exit key." };
	}

	await prisma.votingOption.delete({
		where: { id: optionId },
	});

	return { success: true };
}
