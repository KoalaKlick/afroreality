"use server";
import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe, getFrontendBaseUrl } from "../utils";
import {
	sendNominationConfirmationEmail,
	sendNomineeChangeRequestEmail,
} from "@/lib/email/nomination";
import { extractCategoryPrefix } from "@/lib/utils/nominee-code";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function generateConfirmationCode(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

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

	const nomineeEmail = data.email?.trim();
	if (!nomineeEmail) {
		throw new Error(
			"Nominee email address is required so they can receive their Confirmation Code and change requests."
		);
	}

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

	const confirmationCode = generateConfirmationCode();

	try {
		const option = await prisma.votingOption.create({
			data: {
				eventId: data.eventId,
				categoryId: data.categoryId,
				optionText: data.optionText.trim(),
				email: nomineeEmail,
				phone: data.phone?.trim() || null,
				description: data.description || null,
				imageUrl: data.imageUrl || null,
				nomineeCode,
				deletionCode: confirmationCode,
				status: "approved",
				isPublicNomination: false,
			},
			include: {
				category: true,
				event: {
					include: { organization: true },
				},
			},
		});

		// Send Confirmation Code email to nominee
		sendNominationConfirmationEmail({
			email: nomineeEmail,
			recipientName: option.optionText,
			nomineeName: option.optionText,
			categoryName: option.category?.name || "Category",
			eventName: option.event?.title || "Event",
			status: "approved",
			confirmationCode,
			organizationName: option.event?.organization?.name || "Fextiva",
			bannerUrl: option.event?.bannerImage || option.event?.flierImage,
		}).catch((err) => console.error("[voting] Failed to send nominee confirmation email:", err));

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

	const option = await prisma.votingOption.findUnique({
		where: { id: targetId },
		include: {
			event: { select: { id: true, status: true, startDate: true } },
		},
	});
	if (!option) throw new Error("Nominee not found");

	const eventPublished = option.event.status === "published" || option.event.status === "ongoing";
	const votesOnOption = await prisma.vote.count({ where: { optionId: targetId } });
	const totalOptionVotes = Math.max(Number(option.votesCount || 0), votesOnOption);
	const votesOnEvent = await prisma.vote.count({ where: { eventId: option.eventId } });
	const eventDateStarted = Boolean(option.event.startDate && new Date() >= new Date(option.event.startDate));
	const isVotingStarted = totalOptionVotes > 0 || votesOnEvent > 0 || (eventPublished && eventDateStarted);

	const newCode = rest.nomineeCode?.trim();
	const isCodeChanging = newCode !== undefined && newCode !== (option.nomineeCode || "").trim();

	if (isCodeChanging) {
		if (isVotingStarted) {
			throw new Error("Nominee code cannot be changed once event voting has started.");
		}

		if (newCode) {
			const existing = await prisma.votingOption.findFirst({
				where: {
					eventId: option.eventId,
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

	const recipientEmail = option.email || option.nominatedByEmail;
	if (!recipientEmail) {
		return { success: false, error: "No recipient email found on this nomination" };
	}

	// Ensure every nominee has a Confirmation Code — backfill legacy nominees
	let confirmationCode = option.deletionCode;
	if (!confirmationCode) {
		confirmationCode = generateConfirmationCode();
		await prisma.votingOption.update({
			where: { id: targetId },
			data: { deletionCode: confirmationCode },
		});
	}

	const res = await sendNominationConfirmationEmail({
		email: recipientEmail,
		recipientName: option.nominatedByName || recipientEmail,
		nomineeName: option.optionText,
		categoryName: option.category?.name || "Category",
		eventName: option.event?.title || "Event",
		status: option.status,
		confirmationCode,
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
	const confirmationCode = generateConfirmationCode();
	const nomineeEmail = data.email?.trim() || data.nominatorEmail?.trim() || null;

	try {
		const option = await prisma.votingOption.create({
			data: {
				eventId: data.eventId,
				categoryId: data.categoryId,
				optionText: data.optionText.trim(),
				email: nomineeEmail,
				description: data.description?.trim() || null,
				imageUrl: data.imageUrl || null,
				nominatedByName: data.nominatorName?.trim() || null,
				nominatedByEmail: data.nominatorEmail?.trim() || null,
				nomineeCode,
				status,
				isPublicNomination: true,
				deletionCode: confirmationCode,
			},
		});

		// Fire confirmation email with Confirmation Code
		const recipientEmail = nomineeEmail;
		if (recipientEmail) {
			sendNominationConfirmationEmail({
				email: recipientEmail,
				recipientName: data.nominatorName?.trim() || data.optionText.trim(),
				nomineeName: data.optionText.trim(),
				categoryName: category.name,
				eventName: category.event.title,
				status,
				confirmationCode,
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
 * Public action: Withdraw/delete a public nomination using the exit key / Confirmation Code
 */
export async function withdrawNominationWithKey({
	data,
}: {
	data: { optionId: string; deletionCode: string };
}): Promise<{ success: boolean; error?: string }> {
	const { optionId, deletionCode } = data;
	if (!optionId || !deletionCode?.trim()) {
		return { success: false, error: "Option ID and Confirmation Code are required." };
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
		return { success: false, error: "Invalid Confirmation Code." };
	}

	await prisma.votingOption.delete({
		where: { id: optionId },
	});

	return { success: true };
}

/**
 * Organizer Action: Submit a proposed Edit or Delete request on a nominee.
 * Creates a logged NomineeChangeRequest and sends a notification email to the nominee.
 */
export async function requestNomineeChange({
	data,
}: {
	data: {
		optionId: string;
		requestType: "EDIT" | "DELETE";
		proposedChanges?: {
			optionText?: string;
			categoryId?: string;
			nomineeCode?: string;
			email?: string;
			phone?: string;
			description?: string;
			imageUrl?: string;
		};
	};
}): Promise<{ success: boolean; requestId?: string; requiresNomineeApproval: boolean; message?: string }> {
	const session = await requireSession();
	const { optionId, requestType, proposedChanges = {} } = data;

	if (!optionId) throw new Error("Missing option ID");

	const option = await prisma.votingOption.findUnique({
		where: { id: optionId },
		include: {
			category: true,
			event: {
				include: { organization: true },
			},
		},
	});

	if (!option) throw new Error("Nominee not found");

	// Determine if voting has started / votes exist
	const eventPublished = option.event.status === "published" || option.event.status === "ongoing";
	const votesOnOption = await prisma.vote.count({ where: { optionId } });
	const totalOptionVotes = Math.max(Number(option.votesCount || 0), votesOnOption);
	const votesOnEvent = await prisma.vote.count({ where: { eventId: option.eventId } });
	const eventDateStarted = Boolean(option.event.startDate && new Date() >= new Date(option.event.startDate));
	const isVotingStarted = totalOptionVotes > 0 || votesOnEvent > 0 || (eventPublished && eventDateStarted);

	// Check if this nominee was a paid nomination
	const isPaidNomination =
		Number(option.category?.nominationPrice || 0) > 0 ||
		(option.isPublicNomination === true && Boolean(option.category?.nominationPrice && Number(option.category.nominationPrice) > 0));

	// HARD BOUNDARY CHECKS FOR DELETE
	if (requestType === "DELETE") {
		if (isVotingStarted) {
			throw new Error(
				`Cannot delete "${option.optionText}" because voting has already started or votes have been recorded. Nominees cannot be removed once voting is live.`
			);
		}
		if (isPaidNomination) {
			throw new Error(
				`Cannot delete "${option.optionText}" because this is a paid nomination. Paid nominations cannot be deleted.`
			);
		}

		await prisma.votingOption.delete({ where: { id: optionId } });
		return {
			success: true,
			requiresNomineeApproval: false,
			message: "Nominee deleted successfully.",
		};
	}

	// EDIT FLOW
	const newNomineeCode = proposedChanges.nomineeCode !== undefined ? proposedChanges.nomineeCode.trim() : undefined;
	const isCodeChanging = newNomineeCode !== undefined && newNomineeCode !== (option.nomineeCode || "").trim();

	if (isCodeChanging) {
		if (isVotingStarted) {
			throw new Error("Nominee code cannot be changed once event voting has started.");
		}
		if (newNomineeCode) {
			const existing = await prisma.votingOption.findFirst({
				where: {
					eventId: option.eventId,
					nomineeCode: newNomineeCode,
					id: { not: optionId },
				},
				select: { id: true },
			});
			if (existing) {
				throw new Error(`Nominee code "${newNomineeCode}" is already assigned to another nominee in this event.`);
			}
		}
	}

	// 1. If event is not published OR voting has not started yet, all updates work directly without approval
	if (!eventPublished || !isVotingStarted) {
		await prisma.votingOption.update({
			where: { id: optionId },
			data: {
				...(proposedChanges.optionText !== undefined ? { optionText: proposedChanges.optionText.trim() } : {}),
				...(proposedChanges.description !== undefined ? { description: proposedChanges.description } : {}),
				...(proposedChanges.imageUrl !== undefined ? { imageUrl: proposedChanges.imageUrl } : {}),
				...(proposedChanges.email !== undefined ? { email: proposedChanges.email?.trim() || null } : {}),
				...(proposedChanges.phone !== undefined ? { phone: proposedChanges.phone?.trim() || null } : {}),
				...(proposedChanges.categoryId !== undefined ? { categoryId: proposedChanges.categoryId } : {}),
				...(newNomineeCode !== undefined ? { nomineeCode: newNomineeCode || null } : {}),
			},
		});

		return {
			success: true,
			requiresNomineeApproval: false,
			message: "Nominee updated successfully.",
		};
	}

	// 2. Event is published and voting has started:
	// Only name and email require nominee approval. Other details (photo, description, phone, category) update directly.
	const isNameChanging = proposedChanges.optionText !== undefined && proposedChanges.optionText.trim() !== option.optionText.trim();
	const isEmailChanging = proposedChanges.email !== undefined && proposedChanges.email.trim() !== (option.email || "").trim();

	// Direct update for non-approval fields
	const directUpdateData: any = {};
	if (proposedChanges.description !== undefined && proposedChanges.description !== option.description) {
		directUpdateData.description = proposedChanges.description;
	}
	if (proposedChanges.imageUrl !== undefined && proposedChanges.imageUrl !== option.imageUrl) {
		directUpdateData.imageUrl = proposedChanges.imageUrl;
	}
	if (proposedChanges.phone !== undefined && proposedChanges.phone?.trim() !== (option.phone || "").trim()) {
		directUpdateData.phone = proposedChanges.phone?.trim() || null;
	}
	if (proposedChanges.categoryId !== undefined && proposedChanges.categoryId !== option.categoryId) {
		directUpdateData.categoryId = proposedChanges.categoryId;
	}

	if (Object.keys(directUpdateData).length > 0) {
		await prisma.votingOption.update({
			where: { id: optionId },
			data: directUpdateData,
		});
	}

	// If neither Name nor Email is changing, no approval request needed
	if (!isNameChanging && !isEmailChanging) {
		return {
			success: true,
			requiresNomineeApproval: false,
			message: "Nominee details updated successfully.",
		};
	}

	// Name or Email is changing, send approval request to nominee
	const nomineeApprovalChanges: any = {};
	if (isNameChanging) {
		nomineeApprovalChanges.optionText = proposedChanges.optionText!.trim();
	}
	if (isEmailChanging) {
		nomineeApprovalChanges.email = proposedChanges.email!.trim();
	}

	const changeRequest = await prisma.nomineeChangeRequest.create({
		data: {
			optionId: option.id,
			eventId: option.eventId,
			requestType: requestType as any,
			proposedChanges: nomineeApprovalChanges,
			status: "pending",
			requestedBy: session.userId,
		},
	});

	const nomineeEmail = option.email || option.nominatedByEmail;
	if (!nomineeEmail) {
		throw new Error(
			"Nominee does not have an email address on file. An email is required so they can receive and approve name/email changes."
		);
	}

	const baseUrl = getFrontendBaseUrl().replace(/\/$/, "");
	const confirmUrl = `${baseUrl}/confirm-change/${changeRequest.id}`;

	const items: string[] = [];
	if (isNameChanging) {
		items.push(`<li><strong>Name:</strong> ${escapeHtml(option.optionText)} &rarr; <strong>${escapeHtml(proposedChanges.optionText!)}</strong></li>`);
	}
	if (isEmailChanging) {
		items.push(`<li><strong>Email:</strong> ${escapeHtml(option.email || "None")} &rarr; <strong>${escapeHtml(proposedChanges.email!)}</strong></li>`);
	}
	const changesSummaryHtml = `<ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.6;">${items.join("")}</ul>`;

	// Dispatch Notification Email to Nominee
	await sendNomineeChangeRequestEmail({
		email: nomineeEmail,
		recipientName: option.nominatedByName || option.optionText,
		nomineeName: option.optionText,
		categoryName: option.category?.name || "Category",
		eventName: option.event?.title || "Event",
		organizationName: option.event?.organization?.name || "Fextiva",
		requestType: requestType as any,
		changesSummaryHtml,
		confirmUrl,
		bannerUrl: option.event?.bannerImage || option.event?.flierImage,
	});

	return {
		success: true,
		requestId: changeRequest.id,
		requiresNomineeApproval: true,
		message: `Change request for name/email sent to nominee (${nomineeEmail}) for approval.`,
	};
}

export async function getNomineeChangeRequest(requestId: string): Promise<any> {
	if (!requestId) return null;

	const request = await prisma.nomineeChangeRequest.findUnique({
		where: { id: requestId },
		include: {
			option: {
				select: {
					id: true,
					optionText: true,
					email: true,
					phone: true,
					imageUrl: true,
					description: true,
					nomineeCode: true,
					status: true,
					category: {
						select: { id: true, name: true },
					},
					event: {
						select: {
							id: true,
							title: true,
							slug: true,
							startDate: true,
							organization: {
								select: { name: true, slug: true, logoUrl: true },
							},
						},
					},
				},
			},
		},
	});

	if (!request) return null;

	return serializeJsonSafe(request);
}

/**
 * Public Action: Nominee enters their Confirmation Code in-platform to approve a Change Request
 */
export async function approveNomineeChangeRequest({
	requestId,
	confirmationCode,
}: {
	requestId: string;
	confirmationCode: string;
}): Promise<{ success: boolean; error?: string }> {
	if (!requestId || !confirmationCode?.trim()) {
		return { success: false, error: "Request ID and Confirmation Code are required." };
	}

	const request = await prisma.nomineeChangeRequest.findUnique({
		where: { id: requestId },
		include: {
			option: true,
			event: true,
		},
	});

	if (!request) return { success: false, error: "Change request not found." };

	if (request.status !== "pending") {
		return {
			success: false,
			error: `This request has already been ${request.status}.`,
		};
	}

	// Verify Confirmation Code against option.deletionCode
	const validCode = request.option.deletionCode?.trim();
	if (!validCode || validCode !== confirmationCode.trim()) {
		return {
			success: false,
			error: "Invalid Confirmation Code. Please check the code sent to your email and try again.",
		};
	}

	const { optionId, requestType, proposedChanges } = request;
	const changes = (proposedChanges as any) || {};

	if (requestType === "DELETE") {
		// Re-verify hard boundaries
		const votesOnOption = await prisma.vote.count({ where: { optionId } });
		if (votesOnOption > 0 || Number(request.option.votesCount || 0) > 0) {
			return {
				success: false,
				error: "Cannot delete nominee because votes have already been recorded.",
			};
		}

		await prisma.votingOption.delete({ where: { id: optionId } });
	} else if (requestType === "EDIT") {
		await prisma.votingOption.update({
			where: { id: optionId },
			data: {
				...(changes.optionText !== undefined ? { optionText: changes.optionText.trim() } : {}),
				...(changes.description !== undefined ? { description: changes.description } : {}),
				...(changes.imageUrl !== undefined ? { imageUrl: changes.imageUrl } : {}),
				...(changes.email !== undefined ? { email: changes.email?.trim() || null } : {}),
				...(changes.phone !== undefined ? { phone: changes.phone?.trim() || null } : {}),
				...(changes.categoryId !== undefined ? { categoryId: changes.categoryId } : {}),
				...(changes.nomineeCode !== undefined ? { nomineeCode: changes.nomineeCode.trim() } : {}),
			},
		});
	}

	// Mark request approved
	await prisma.nomineeChangeRequest.update({
		where: { id: requestId },
		data: {
			status: "approved",
			resolvedAt: new Date(),
		},
	});

	revalidatePath(`/my-events/${request.eventId}`);

	return { success: true };
}

/**
 * Public Action: Nominee declines/rejects a Change Request in-platform
 */
export async function rejectNomineeChangeRequest({
	requestId,
}: {
	requestId: string;
}): Promise<{ success: boolean; error?: string }> {
	if (!requestId) return { success: false, error: "Missing request ID" };

	const request = await prisma.nomineeChangeRequest.findUnique({
		where: { id: requestId },
	});

	if (!request) return { success: false, error: "Request not found" };

	if (request.status !== "pending") {
		return { success: false, error: `Request is already ${request.status}` };
	}

	await prisma.nomineeChangeRequest.update({
		where: { id: requestId },
		data: {
			status: "rejected",
			resolvedAt: new Date(),
		},
	});

	return { success: true };
}
