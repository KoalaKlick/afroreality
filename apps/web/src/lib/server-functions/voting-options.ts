"use server";
import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSession } from "../session";
import { serializeJsonSafe, getFrontendBaseUrl } from "../utils";
import {
	sendNominationConfirmationEmail,
	sendNomineeChangeRequestEmail,
	sendNomineeUpdateNotificationEmail,
} from "@/lib/email/nomination";
import { extractCategoryPrefix, extractEventPrefixCandidates } from "@/lib/utils/nominee-code";
import { logEventActivity } from "@/lib/audit/audit-logger";
import { sendNomineeConfirmationWhatsAppNotification, sendWhatsAppTextMessage, normalizePhoneNumber } from "@/lib/services/whatsapp";
import { sendSmsMessage } from "@/lib/services/sms";

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

function getRandomAvailableNumber(usedNumbers: Set<number>): number | null {
	const availableNumbers = Array.from({ length: 99 }, (_, index) => index + 1)
		.filter((number) => !usedNumbers.has(number));

	if (availableNumbers.length === 0) return null;
	return availableNumbers[Math.floor(Math.random() * availableNumbers.length)] ?? null;
}

/**
/**
 * Generate a 4-character nominee code: exactly 2 alphabets and 2 numbers (e.g. "GM01").
 * Uses an algorithm that ensures uniqueness across different events:
 * 1. Derives unique 2-letter uppercase prefixes for the event based on event title/slug.
 * 2. Checks against all other events so no two events share the same 2-letter prefix.
 * 3. Assigns a random unused 2-digit number (01-99) within that event's prefix.
 */
export async function generateNomineeCode(
	eventId: string,
	categoryIdOrName?: string | null,
	fallbackText?: string | null,
): Promise<string> {
	try {
		const event = await prisma.event.findUnique({
			where: { id: eventId },
			select: {
				id: true,
				title: true,
				slug: true,
				votingOptions: {
					select: { nomineeCode: true },
				},
			},
		});

		// 1. Gather all 2-letter prefixes currently in use by OTHER events
		const otherOptions = await prisma.votingOption.findMany({
			where: {
				eventId: { not: eventId },
				nomineeCode: { not: null },
			},
			select: { nomineeCode: true },
		});

		const takenByOtherEvents = new Set<string>();
		for (const opt of otherOptions) {
			if (opt.nomineeCode) {
				const m = /^([A-Za-z]{2})\d{2}$/.exec(opt.nomineeCode.trim());
				if (m && m[1]) {
					takenByOtherEvents.add(m[1].toUpperCase());
				}
			}
		}

		// 2. Check existing nominee codes in THIS event
		const thisEventCodes = (event?.votingOptions || [])
			.map((o) => (o.nomineeCode || "").trim().toUpperCase())
			.filter(Boolean);

		// Find 2-letter prefixes already active in this event
		const thisEventActivePrefixes: string[] = [];
		for (const code of thisEventCodes) {
			const m = /^([A-Z]{2})\d{2}$/.exec(code);
			if (m && m[1] && !thisEventActivePrefixes.includes(m[1])) {
				thisEventActivePrefixes.push(m[1]);
			}
		}

		// 3. Try to use an existing prefix already established for this event (if room 01-99 exists)
		for (const prefix of thisEventActivePrefixes) {
			if (takenByOtherEvents.has(prefix)) continue;

			const usedNumbers = new Set<number>();
			for (const code of thisEventCodes) {
				if (code.startsWith(prefix)) {
					const num = Number.parseInt(code.slice(2), 10);
					if (!Number.isNaN(num)) usedNumbers.add(num);
				}
			}

			const randomNumber = getRandomAvailableNumber(usedNumbers);
			if (randomNumber !== null) {
				return `${prefix}${randomNumber.toString().padStart(2, "0")}`;
			}
		}

		// 4. Generate candidate 2-letter prefixes for this event from title / slug
		const candidates = extractEventPrefixCandidates(event?.title, event?.slug);

		// Also try category initials if provided
		let categoryName: string | null = null;
		if (categoryIdOrName) {
			const cat = await prisma.votingCategory.findUnique({
				where: { id: categoryIdOrName },
				select: { name: true },
			});
			categoryName = cat?.name || categoryIdOrName;
		} else if (fallbackText) {
			categoryName = fallbackText;
		}
		if (categoryName) {
			const catPrefix = extractCategoryPrefix(categoryName);
			if (catPrefix && /^[A-Z]{2}$/.test(catPrefix)) {
				candidates.push(catPrefix);
			}
		}

		// Additional letter pairs from event title
		if (event?.title) {
			const cleanLetters = event.title.toUpperCase().replace(/[^A-Z]/g, "");
			for (let i = 0; i < cleanLetters.length - 1; i++) {
				candidates.push(cleanLetters[i]! + cleanLetters[i + 1]!);
			}
		}

		// Full alphabet grid fallback: AA .. ZZ
		const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		for (let i = 0; i < alphabet.length; i++) {
			for (let j = 0; j < alphabet.length; j++) {
				candidates.push(alphabet[i]! + alphabet[j]!);
			}
		}

		// 5. Select the first candidate prefix not used by other events
		let chosenPrefix = "EV";
		for (const cand of candidates) {
			if (/^[A-Z]{2}$/.test(cand) && !takenByOtherEvents.has(cand)) {
				chosenPrefix = cand;
				break;
			}
		}

		// Choose a random free number 01-99 for this prefix
		const usedNumbers = new Set<number>();
		for (const code of thisEventCodes) {
			if (code.startsWith(chosenPrefix)) {
				const num = Number.parseInt(code.slice(2), 10);
				if (!Number.isNaN(num)) usedNumbers.add(num);
			}
		}

		const randomNumber = getRandomAvailableNumber(usedNumbers);
		if (randomNumber !== null) {
			return `${chosenPrefix}${randomNumber.toString().padStart(2, "0")}`;
		}

		return `${chosenPrefix}01`;
	} catch (error) {
		console.error("Error generating nominee code:", error);
		const randomLetter1 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
		const randomLetter2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
		const randomDigits = Math.floor(Math.random() * 90 + 10);
		return `${randomLetter1}${randomLetter2}${randomDigits}`;
	}
}

/**
 * Organizer action: Add an approved nominee directly
 */
export async function createVotingOption({ data }: { data: any }): Promise<any> {
	const session = await requireSession();
	const eventId = data.eventId;

	const nomineeEmail = data.email?.trim() || null;

	let nomineeCode = data.nomineeCode?.trim();

	if (nomineeCode) {
		nomineeCode = nomineeCode.toUpperCase();
		const existing = await prisma.votingOption.findFirst({
			where: {
				nomineeCode: { equals: nomineeCode, mode: "insensitive" },
			},
			select: { id: true, eventId: true, event: { select: { title: true } } },
		});
		if (existing) {
			const isSame = existing.eventId === eventId;
			throw new Error(
				isSame
					? `Nominee code "${nomineeCode}" is already taken for this event. Please choose a different code or leave it blank to auto-generate.`
					: `Nominee code "${nomineeCode}" is already in use by another event ("${existing.event?.title || "another event"}"). Please choose a unique 4-character code (2 letters + 2 numbers) or leave it blank to auto-generate.`
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

		// Send Confirmation Code email to nominee once if email exists
		if (nomineeEmail) {
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
			})
				.then(async (emailRes) => {
					if (emailRes.success) {
						await prisma.votingOption.update({
							where: { id: option.id },
							data: {
								confirmationEmailSentAt: new Date(),
								confirmationEmailStatus: "sent",
								confirmationEmailError: null,
							},
						});
					} else {
						await prisma.votingOption.update({
							where: { id: option.id },
							data: {
								confirmationEmailStatus: "failed",
								confirmationEmailError: emailRes.error || "Email delivery failed",
							},
						});
					}
				})
				.catch(async (err) => {
					console.error("[voting] Failed to send nominee confirmation email:", err);
					await prisma.votingOption.update({
						where: { id: option.id },
						data: {
							confirmationEmailStatus: "failed",
							confirmationEmailError: err?.message || "Email dispatch failed",
						},
					}).catch(() => {});
				});
		}

		// Send WhatsApp nomination confirmation if phone exists and enabled
		if (option.phone && data.sendWhatsAppConfirmation !== false) {
			sendNomineeWhatsAppConfirmation({
				data: { optionId: option.id },
			}).catch((err) => console.error("[voting] Failed to send nominee WhatsApp confirmation:", err));
		}

		// Log in event audit trail with machine IP
		await logEventActivity({
			eventId: data.eventId,
			organizationId: option.event?.organization?.id,
			userId: session.userId,
			action: "nominee_created",
			entityType: "nominee",
			entityId: option.id,
			description: `Added nominee "${option.optionText}" (Code: #${option.nomineeCode || "N/A"})${nomineeEmail ? ` with email ${nomineeEmail}` : " (No email provided)"}`,
			metadata: {
				nomineeId: option.id,
				nomineeName: option.optionText,
				nomineeCode: option.nomineeCode,
				categoryId: option.categoryId,
				categoryName: option.category?.name,
				hasEmail: Boolean(nomineeEmail),
				email: nomineeEmail,
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
	const session = await requireSession();
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

	const currentCode = (option.nomineeCode || "").trim().toUpperCase();
	const newCode = rest.nomineeCode ? rest.nomineeCode.trim().toUpperCase() : undefined;
	const isCodeChanging = Boolean(newCode && newCode !== currentCode);

	if (isCodeChanging) {
		if (isVotingStarted) {
			throw new Error("Nominee code cannot be changed once event voting has started or the event is published.");
		}

		if (newCode) {
			const existing = await prisma.votingOption.findFirst({
				where: {
					nomineeCode: { equals: newCode, mode: "insensitive" },
					id: { not: targetId },
				},
				select: { id: true, eventId: true, event: { select: { title: true } } },
			});
			if (existing) {
				const isSame = existing.eventId === option.eventId;
				throw new Error(
					isSame
						? `Nominee code "${newCode}" is already assigned to another nominee in this event.`
						: `Nominee code "${newCode}" is already in use by another event ("${existing.event?.title || "another event"}"). Please choose a unique 4-character code (2 letters + 2 numbers).`
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

		// Build field-level change diff for the audit trail
		const metadataChanges: Record<string, { from: any; to: any }> = {};
		const trackableFields = ["optionText", "email", "phone", "nomineeCode", "description", "imageUrl", "categoryId"] as const;
		for (const field of trackableFields) {
			const oldVal = (option as any)[field];
			const newVal = (updated as any)[field];
			if (newVal !== undefined && String(newVal ?? "") !== String(oldVal ?? "")) {
				metadataChanges[field] = { from: oldVal ?? null, to: newVal ?? null };
			}
		}
		const changedFields = Object.keys(metadataChanges);
		const changeSummary = changedFields.length > 0 ? changedFields.join(", ") : "details";

		await logEventActivity({
			eventId: option.eventId,
			userId: session.userId,
			action: "nominee_updated",
			entityType: "nominee",
			entityId: targetId,
			description: `Updated nominee "${updated.optionText}" (${changeSummary})`,
			metadata: {
				nomineeId: targetId,
				nomineeName: updated.optionText,
				changes: metadataChanges,
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
	const session = await requireSession();
	const targetId = data.id || data.optionId;
	if (!targetId) throw new Error("Missing option id");
	const updated = await prisma.votingOption.update({
		where: { id: targetId },
		data: { status: data.status },
		include: { event: { select: { id: true, title: true, organizationId: true } } },
	});

	await logEventActivity({
		eventId: updated.eventId,
		organizationId: updated.event?.organizationId,
		userId: session.userId,
		action: "nominee_status_updated",
		entityType: "nominee",
		entityId: targetId,
		description: `Status of nominee "${updated.optionText}" changed to "${data.status}"`,
		metadata: { nomineeId: targetId, nomineeName: updated.optionText, newStatus: data.status },
	});

	return serializeJsonSafe(updated);
}

export async function deleteVotingOption({ data }: { data: any }): Promise<any> {
	const session = await requireSession();
	const targetId = data.id || data.optionId;
	if (!targetId) throw new Error("Missing option id");

	const option = await prisma.votingOption.findUnique({
		where: { id: targetId },
		select: { id: true, deletionCode: true, votesCount: true, optionText: true, eventId: true, nomineeCode: true },
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

	await logEventActivity({
		eventId: option.eventId,
		userId: session.userId,
		action: "nominee_deleted",
		entityType: "nominee",
		entityId: targetId,
		description: `Deleted nominee "${option.optionText}" (Code: #${option.nomineeCode || "N/A"})`,
		metadata: { nomineeId: targetId, nomineeName: option.optionText, nomineeCode: option.nomineeCode },
	});

	return { success: true };
}

export async function approveNomination({ data }: { data: any }): Promise<any> {
	const session = await requireSession();
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

	// Send approval email notification once per nominee if recipient email exists
	const recipientEmail = option.nominatedByEmail || option.email;
	if (recipientEmail && option.confirmationEmailStatus !== "sent") {
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
		})
			.then(async (emailRes) => {
				if (emailRes.success) {
					await prisma.votingOption.update({
						where: { id: targetId },
						data: {
							confirmationEmailSentAt: new Date(),
							confirmationEmailStatus: "sent",
							confirmationEmailError: null,
						},
					});
				} else {
					await prisma.votingOption.update({
						where: { id: targetId },
						data: {
							confirmationEmailStatus: "failed",
							confirmationEmailError: emailRes.error || "Email delivery failed",
						},
					});
				}
			})
			.catch(async (err) => {
				console.error("[voting] Failed to send approval email:", err);
				await prisma.votingOption.update({
					where: { id: targetId },
					data: {
						confirmationEmailStatus: "failed",
						confirmationEmailError: err?.message || "Email dispatch failed",
					},
				}).catch(() => {});
			});
	}

	await logEventActivity({
		eventId: option.eventId,
		organizationId: option.event?.organization?.id,
		userId: session.userId,
		action: "nominee_approved",
		entityType: "nominee",
		entityId: targetId,
		description: `Approved nomination for "${option.optionText}" in category "${option.category?.name || "General"}"`,
		metadata: { nomineeId: targetId, nomineeName: option.optionText, categoryName: option.category?.name },
	});

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
		await prisma.votingOption.update({
			where: { id: targetId },
			data: {
				confirmationEmailStatus: "failed",
				confirmationEmailError: res.error || "Failed to send email",
			},
		});
		return { success: false, error: res.error || "Failed to send email" };
	}

	await prisma.votingOption.update({
		where: { id: targetId },
		data: {
			confirmationEmailSentAt: new Date(),
			confirmationEmailStatus: "sent",
			confirmationEmailError: null,
		},
	});

	return { success: true };
}

/**
 * Clean WhatsApp message builder for candidate nomination confirmations
 */
function buildNomineeWhatsAppMessage({
	nomineeName,
	eventName,
	categoryName,
	organizationName,
	organizationPhone,
	nomineeCode,
	confirmationCode,
}: {
	nomineeName: string;
	eventName: string;
	categoryName: string;
	organizationName: string;
	organizationPhone?: string | null;
	nomineeCode?: string | null;
	confirmationCode?: string | null;
}): string {
	const lines = [
		`Hi ${nomineeName},`,
		``,
		`You’ve been nominated for *${eventName}* as *${categoryName}*. We’re following up to confirm your nomination and keep you updated on the next steps.`,
		``,
		`📸 Kindly send us a picture to be used for your nomination flyer.`,
	];

	if (nomineeCode && nomineeCode.trim()) {
		lines.push(``);
		lines.push(`🗳️ Your Voting Code: *#${nomineeCode.trim()}*`);
	}

	if (organizationPhone && organizationPhone.trim()) {
		lines.push(``);
		lines.push(`💬 Organizer WhatsApp / Contact: ${organizationPhone.trim()}`);
	}

	// v2 feature: candidate confirmation / approval code deferred
	// if (confirmationCode) {
	// 	lines.push(``);
	// 	lines.push(`🔐 Your Confirmation Code: *${confirmationCode}*`);
	// }

	lines.push(``);
	lines.push(`Thank you for participating! 💚`);
	lines.push(`— *${organizationName}*`);

	return lines.join("\n");
}

/**
 * Send WhatsApp nomination confirmation message to a nominee
 */
export async function sendNomineeWhatsAppConfirmation({
	data,
}: {
	data: { optionId: string };
}): Promise<{ success: boolean; message?: string; waUrl?: string; error?: string }> {
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

	const alreadySent =
		option.confirmationWhatsAppStatus === "sent" ||
		option.confirmationWhatsAppStatus === "delivered" ||
		option.confirmationWhatsAppStatus === "read";
	if (alreadySent) {
		return {
			success: true,
			message: `WhatsApp nomination confirmation was already sent to ${option.optionText}.`,
		};
	}

	const nomineePhone = option.phone?.trim();
	if (!nomineePhone) {
		return { success: false, error: "Nominee does not have a phone number recorded." };
	}

	const normalizedPhone = normalizePhoneNumber(nomineePhone);
	const nomineeName = option.optionText.trim();
	const eventName = option.event?.title?.trim() || "Event";
	const categoryName = option.category?.name?.trim() || "Category";
	const organizationName = option.event?.organization?.name?.trim() || "Fextiva";
	const organizationPhone = option.event?.organization?.phone?.trim() || null;
	const org = option.event?.organization;

	// Build the event public path for the "View Event" button
	const eventSlug = option.event?.slug;
	const orgSlug = org?.slug;
	const eventPath = orgSlug && eventSlug ? `${orgSlug}/event/${eventSlug}` : eventSlug || null;

	// Banner: prefer event flier, then banner, then org logo
	const bannerImageUrl =
		option.event?.flierImage ||
		option.event?.bannerImage ||
		org?.logoUrl ||
		null;

	// Fallback wa.me deep-link (used in error response so UI can open a manual thread)
	const cleanDigits = normalizedPhone.replace(/\D/g, "");
	const waUrl = `https://wa.me/${cleanDigits}`;

	try {
		const waRes = await sendNomineeConfirmationWhatsAppNotification({
			phone: normalizedPhone,
			nomineeName,
			eventName,
			categoryName,
			nomineeCode: option.nomineeCode,
			eventPath,
			bannerImageUrl,
			organizationName,
			organizationPhone,
		});

		const waUrl = waRes.waUrl || `https://wa.me/${cleanDigits}`;

		if (waRes.success) {
			await prisma.votingOption.update({
				where: { id: option.id },
				data: {
					confirmationWhatsAppSentAt: new Date(),
					confirmationWhatsAppStatus: "sent",
					confirmationWhatsAppMessageId: waRes.messageId || null,
					confirmationWhatsAppError: null,
				},
			});

			await logEventActivity({
				eventId: option.eventId,
				organizationId: org?.id,
				action: "nominee_whatsapp_sent",
				entityType: "nominee",
				entityId: option.id,
				description: `Sent nomination confirmation WhatsApp to "${nomineeName}" (${normalizedPhone})`,
			});

			return {
				success: true,
				message: `WhatsApp nomination confirmation sent to ${nomineeName}!`,
				waUrl,
			};
		} else {
			await prisma.votingOption.update({
				where: { id: option.id },
				data: {
					confirmationWhatsAppStatus: "failed",
					confirmationWhatsAppError: waRes.error || "Meta WhatsApp Cloud message could not be delivered automatically.",
				},
			});

			return {
				success: false,
				error: waRes.error || "Meta WhatsApp Cloud message could not be delivered automatically.",
				waUrl,
			};
		}
	} catch (err: any) {
		await prisma.votingOption.update({
			where: { id: option.id },
			data: {
				confirmationWhatsAppStatus: "failed",
				confirmationWhatsAppError: err?.message || "Failed to dispatch WhatsApp message.",
			},
		}).catch(() => {});

		return {
			success: false,
			error: err?.message || "Failed to dispatch WhatsApp message.",
			waUrl,
		};
	}
}

/**
 * Sends nomination confirmation (email and/or WhatsApp) to a single nominee.
 * Tracks confirmation status and skips already successful channels unless explicitly requested.
 */
export async function sendNomineeConfirmation({
	data,
}: {
	data: { optionId: string };
}): Promise<{ success: boolean; message: string; error?: string; waUrl?: string }> {
	await requireSession();
	const { optionId } = data;
	if (!optionId) return { success: false, message: "", error: "Missing nominee ID" };

	const option = await prisma.votingOption.findUnique({
		where: { id: optionId },
		include: {
			category: true,
			event: { include: { organization: true } },
		},
	});

	if (!option) return { success: false, message: "", error: "Nominee not found" };

	const nomineeEmail = option.email?.trim() || option.nominatedByEmail?.trim();
	const nomineePhone = option.phone?.trim();

	if (!nomineeEmail && !nomineePhone) {
		return { success: false, message: "", error: "Nominee has no email or phone number recorded." };
	}

	const results: string[] = [];
	let hasSuccess = false;

	// Send Email
	if (nomineeEmail) {
		try {
			const emailRes = await sendNominationConfirmationEmail({
				email: nomineeEmail,
				recipientName: option.optionText,
				nomineeName: option.optionText,
				categoryName: option.category?.name || "Category",
				eventName: option.event?.title || "Event",
				status: option.status,
				nomineeCode: option.nomineeCode,
				organizationName: option.event?.organization?.name || "Fextiva",
				bannerUrl: option.event?.bannerImage || option.event?.flierImage,
			});

			if (emailRes.success) {
				hasSuccess = true;
				await prisma.votingOption.update({
					where: { id: option.id },
					data: {
						confirmationEmailSentAt: new Date(),
						confirmationEmailStatus: "sent",
						confirmationEmailError: null,
					},
				});
				results.push("Email sent");
			} else {
				await prisma.votingOption.update({
					where: { id: option.id },
					data: {
						confirmationEmailStatus: "failed",
						confirmationEmailError: emailRes.error || "Email failed",
					},
				});
				results.push(`Email failed (${emailRes.error || "error"})`);
			}
		} catch (err: any) {
			results.push("Email dispatch error");
		}
	}

	// Send WhatsApp
	let waUrl: string | undefined = undefined;
	if (nomineePhone) {
		const waRes = await sendNomineeWhatsAppConfirmation({ data: { optionId: option.id } });
		if (waRes.success) {
			hasSuccess = true;
			results.push("WhatsApp sent");
		} else {
			results.push("WhatsApp failed");
			if (waRes.waUrl) waUrl = waRes.waUrl;
		}
	}

	return {
		success: hasSuccess,
		message: `Confirmation: ${results.join(", ")}`,
		error: hasSuccess ? undefined : results.join(", "),
		waUrl,
	};
}

/**
 * Sends nomination confirmation to all approved nominees in a category who have not yet
 * successfully received them (or whose previous attempt failed).
 */
export async function sendCategoryNomineeConfirmations({
	data,
}: {
	data: { categoryId: string };
}): Promise<{ success: boolean; sentCount: number; message: string; error?: string }> {
	await requireSession();
	const { categoryId } = data;
	if (!categoryId) return { success: false, sentCount: 0, message: "", error: "Missing category ID" };

	const category = await prisma.votingCategory.findUnique({
		where: { id: categoryId },
		include: {
			event: { include: { organization: true } },
			votingOptions: {
				where: { status: "approved" },
			},
		},
	});

	if (!category) return { success: false, sentCount: 0, message: "", error: "Category not found" };

	const event = category.event;
	const org = event?.organization;
	const bannerImageUrl = event?.flierImage || event?.bannerImage || org?.logoUrl || null;

	let sentCount = 0;

	for (const option of category.votingOptions) {
		const nomineeEmail = option.email?.trim() || option.nominatedByEmail?.trim();
		const nomineePhone = option.phone?.trim();
		let neededSend = false;

		// 1. Send Email if not yet successfully sent
		if (nomineeEmail && option.confirmationEmailStatus !== "sent") {
			neededSend = true;
			try {
				const emailRes = await sendNominationConfirmationEmail({
					email: nomineeEmail,
					recipientName: option.optionText,
					nomineeName: option.optionText,
					categoryName: category.name,
					eventName: event.title,
					status: "approved",
					nomineeCode: option.nomineeCode,
					organizationName: org?.name || "Fextiva",
					bannerUrl: bannerImageUrl,
				});

				if (emailRes.success) {
					await prisma.votingOption.update({
						where: { id: option.id },
						data: {
							confirmationEmailSentAt: new Date(),
							confirmationEmailStatus: "sent",
							confirmationEmailError: null,
						},
					});
				} else {
					await prisma.votingOption.update({
						where: { id: option.id },
						data: {
							confirmationEmailStatus: "failed",
							confirmationEmailError: emailRes.error || "Email delivery failed",
						},
					});
				}
			} catch (err: any) {
				await prisma.votingOption.update({
					where: { id: option.id },
					data: {
						confirmationEmailStatus: "failed",
						confirmationEmailError: err?.message || "Failed to send email",
					},
				}).catch(() => {});
			}
		}

		// 2. Send WhatsApp if phone exists and not yet delivered/sent
		const waDone =
			option.confirmationWhatsAppStatus === "delivered" ||
			option.confirmationWhatsAppStatus === "read" ||
			option.confirmationWhatsAppStatus === "sent";

		if (nomineePhone && !waDone) {
			const waRes = await sendNomineeWhatsAppConfirmation({ data: { optionId: option.id } }).catch(() => ({
				success: false,
			}));
			if (waRes.success) neededSend = true;
		}

		if (neededSend) {
			sentCount++;
		}
	}

	return {
		success: true,
		sentCount,
		message:
			sentCount > 0
				? `Dispatched confirmations to ${sentCount} nominee(s).`
				: "All nominees with contact details have already received their confirmations.",
	};
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

		// Fire confirmation email once if not already sent
		const recipientEmail = nomineeEmail;
		if (recipientEmail && option.confirmationEmailStatus !== "sent") {
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
			})
				.then(async (emailRes) => {
					if (emailRes.success) {
						await prisma.votingOption.update({
							where: { id: option.id },
							data: {
								confirmationEmailSentAt: new Date(),
								confirmationEmailStatus: "sent",
								confirmationEmailError: null,
							},
						});
					} else {
						await prisma.votingOption.update({
							where: { id: option.id },
							data: {
								confirmationEmailStatus: "failed",
								confirmationEmailError: emailRes.error || "Email delivery failed",
							},
						});
					}
				})
				.catch((err) =>
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

		await logEventActivity({
			eventId: option.eventId,
			organizationId: option.event?.organization?.id,
			userId: session.userId,
			action: "nominee_deleted",
			entityType: "nominee",
			entityId: optionId,
			description: `Deleted nominee "${option.optionText}" (Code: #${option.nomineeCode || "N/A"})`,
			metadata: {
				nomineeId: optionId,
				nomineeName: option.optionText,
				nomineeCode: option.nomineeCode,
			},
		});

		return {
			success: true,
			requiresNomineeApproval: false,
			message: "Nominee deleted successfully.",
		};
	}

	// EDIT FLOW
	const currentCode = (option.nomineeCode || "").trim().toUpperCase();
	const newNomineeCode = proposedChanges.nomineeCode ? proposedChanges.nomineeCode.trim().toUpperCase() : undefined;
	const isCodeChanging = Boolean(newNomineeCode && newNomineeCode !== currentCode);

	if (isCodeChanging) {
		if (isVotingStarted) {
			return {
				success: false,
				requiresNomineeApproval: false,
				message: "Nominee code cannot be changed once event voting has started or the event is published.",
			};
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
				return {
					success: false,
					requiresNomineeApproval: false,
					message: `Nominee code "${newNomineeCode}" is already assigned to another nominee in this event.`,
				};
			}
		}
	}

	// Build update payload and audit diff
	const updateData: any = {};
	const changesList: string[] = [];
	const metadataChanges: Record<string, { from: any; to: any }> = {};

	if (proposedChanges.optionText !== undefined && proposedChanges.optionText.trim() !== option.optionText.trim()) {
		updateData.optionText = proposedChanges.optionText.trim();
		changesList.push(`<li><strong>Name:</strong> ${escapeHtml(option.optionText)} &rarr; <strong>${escapeHtml(updateData.optionText)}</strong></li>`);
		metadataChanges.name = { from: option.optionText, to: updateData.optionText };
	}
	if (proposedChanges.email !== undefined && proposedChanges.email.trim() !== (option.email || "").trim()) {
		updateData.email = proposedChanges.email.trim() || null;
		changesList.push(`<li><strong>Email:</strong> ${escapeHtml(option.email || "None")} &rarr; <strong>${escapeHtml(updateData.email || "None")}</strong></li>`);
		metadataChanges.email = { from: option.email, to: updateData.email };
	}
	if (proposedChanges.phone !== undefined && proposedChanges.phone?.trim() !== (option.phone || "").trim()) {
		updateData.phone = proposedChanges.phone?.trim() || null;
		changesList.push(`<li><strong>Phone:</strong> ${escapeHtml(option.phone || "None")} &rarr; <strong>${escapeHtml(updateData.phone || "None")}</strong></li>`);
		metadataChanges.phone = { from: option.phone, to: updateData.phone };
	}
	if (isCodeChanging && newNomineeCode) {
		updateData.nomineeCode = newNomineeCode;
		changesList.push(`<li><strong>Nominee Code:</strong> #${option.nomineeCode || "N/A"} &rarr; #${updateData.nomineeCode}</li>`);
		metadataChanges.nomineeCode = { from: option.nomineeCode, to: updateData.nomineeCode };
	}
	if (proposedChanges.description !== undefined && proposedChanges.description !== option.description) {
		updateData.description = proposedChanges.description;
		changesList.push(`<li><strong>Bio:</strong> Updated</li>`);
		metadataChanges.description = { from: "previous bio", to: "updated bio" };
	}
	if (proposedChanges.imageUrl !== undefined && proposedChanges.imageUrl !== option.imageUrl) {
		updateData.imageUrl = proposedChanges.imageUrl;
		changesList.push(`<li><strong>Photo:</strong> Updated</li>`);
		metadataChanges.imageUrl = { from: option.imageUrl, to: proposedChanges.imageUrl };
	}
	if (proposedChanges.categoryId !== undefined && proposedChanges.categoryId !== option.categoryId) {
		updateData.categoryId = proposedChanges.categoryId;
		changesList.push(`<li><strong>Category:</strong> Changed category</li>`);
		metadataChanges.categoryId = { from: option.categoryId, to: proposedChanges.categoryId };
	}

	// Apply direct update to the nominee in database
	if (Object.keys(updateData).length > 0) {
		await prisma.votingOption.update({
			where: { id: optionId },
			data: updateData,
		});
	}

	/*
	 * =========================================================================
	 * STRICT NOMINEE APPROVAL FLOW (COMMENTED OUT PER USER SPECIFICATION):
	 *
	 * Previously, when event was published and voting started, changes to name or email
	 * were forced into a pending NomineeChangeRequest requiring the nominee to manually
	 * confirm before applying. This strict rule has been commented out. Instead, updates
	 * apply directly and we dispatch an informational reminder to their email if present.
	 * (Future implementation will support WhatsApp notifications when no email exists).
	 *
	 * const changeRequest = await prisma.nomineeChangeRequest.create({
	 *   data: {
	 *     optionId: option.id,
	 *     eventId: option.eventId,
	 *     requestType: requestType as any,
	 *     proposedChanges: nomineeApprovalChanges,
	 *     status: "pending",
	 *     requestedBy: session.userId,
	 *   },
	 * });
	 * =========================================================================
	 */

	// Send informational reminder email to the nominee if email is present
	const nomineeEmail = updateData.email !== undefined ? updateData.email : (option.email || option.nominatedByEmail);
	if (nomineeEmail && changesList.length > 0) {
		const changesSummaryHtml = `<ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.6;">${changesList.join("")}</ul>`;
		sendNomineeUpdateNotificationEmail({
			email: nomineeEmail,
			recipientName: option.nominatedByName || updateData.optionText || option.optionText,
			nomineeName: updateData.optionText || option.optionText,
			categoryName: option.category?.name || "Category",
			eventName: option.event?.title || "Event",
			organizationName: option.event?.organization?.name || "Fextiva",
			changesSummaryHtml,
			bannerUrl: option.event?.bannerImage || option.event?.flierImage,
		}).catch((err) =>
			console.error("[voting] Failed to send nominee update notification email:", err),
		);
	}

	// Send update notice to nominee via WhatsApp or SMS based on configured channel
	const nomineePhone = updateData.phone !== undefined ? updateData.phone : option.phone;
	if (nomineePhone && changesList.length > 0) {
		const targetPhone = nomineePhone.trim();
		const nomineeName = updateData.optionText || option.optionText;
		const eventTitle = option.event?.title || "Event";
		const votingCodeStr = option.nomineeCode ? ` Voting Code: #${option.nomineeCode}.` : "";
		const updateNotice = `Hi ${nomineeName}, your nominee profile for "${eventTitle}" has been updated by the event organizers.${votingCodeStr} Thank you!`;

		prisma.eventMessagingConfig.findUnique({
			where: { eventId: option.eventId },
		}).then((cfg) => {
			const channel = cfg?.reportChannel || "whatsapp_sms";
			if (channel === "whatsapp" || channel === "whatsapp_sms") {
				sendWhatsAppTextMessage({
					to: normalizePhoneNumber(targetPhone),
					text: updateNotice,
				}).then((res) => {
					if (!res.success && channel === "whatsapp_sms") {
						sendSmsMessage({
							to: targetPhone,
							message: updateNotice,
							purpose: "nominee_update_notice",
						}).catch(() => {});
					}
				}).catch(() => {
					if (channel === "whatsapp_sms") {
						sendSmsMessage({
							to: targetPhone,
							message: updateNotice,
							purpose: "nominee_update_notice",
						}).catch(() => {});
					}
				});
			} else if (channel === "sms") {
				sendSmsMessage({
					to: targetPhone,
					message: updateNotice,
					purpose: "nominee_update_notice",
				}).catch(() => {});
			}
		}).catch(() => {});
	}

	// Record action in Event Audit Trail with machine IP
	const updatedNomineeName = updateData.optionText || option.optionText;
	const changeKeys = Object.keys(updateData);
	const changeSummaryStr = changeKeys.length > 0 ? changeKeys.join(", ") : "no changes";

	await logEventActivity({
		eventId: option.eventId,
		organizationId: option.event?.organization?.id,
		userId: session.userId,
		action: "nominee_updated",
		entityType: "nominee",
		entityId: option.id,
		description: `Updated nominee "${updatedNomineeName}" (${changeSummaryStr})`,
		metadata: {
			nomineeId: option.id,
			nomineeName: updatedNomineeName,
			changes: metadataChanges,
			hasEmail: Boolean(nomineeEmail),
			email: nomineeEmail || null,
		},
	});

	return {
		success: true,
		requiresNomineeApproval: false,
		message: `Nominee "${updatedNomineeName}" updated successfully.${nomineeEmail ? ` Notification sent to ${nomineeEmail}.` : ""}`,
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
