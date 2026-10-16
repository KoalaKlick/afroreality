import { prisma } from "@repo/db";
import { sendVoteReceiptWhatsAppNotification } from "@/lib/services/whatsapp";
import { sendVoteReceiptSms } from "@/lib/services/sms";
import { getEventMessagingConfig } from "@/lib/server-functions/event-messaging-config";

export async function fulfillVotePurchase({
	payment,
	metadata,
	reference,
}: {
	payment: any;
	metadata: any;
	reference: string;
}): Promise<void> {
	const optionId = metadata.optionId || metadata.votingOptionId;
	const categoryId = metadata.categoryId;
	const eventId = metadata.eventId;
	const voteCount = Math.max(1, Number(metadata.voteCount) || Number(metadata.quantity) || 1);
	const voterPhone = metadata.voterPhone || metadata.phone || metadata.phone_number || null;
	const voterEmail = metadata.voterEmail || payment.email || null;

	if (!optionId || !eventId) return;

	const vote = await prisma.vote.create({
		data: { eventId, optionId, categoryId: categoryId || null, paymentId: payment.id, voteCount, voterPhone, voterEmail },
	});

	await prisma.votingOption.update({
		where: { id: optionId },
		data: { votesCount: { increment: voteCount } },
	});

	if (!voterPhone) return;

	try {
		const [option, messagingConfig] = await Promise.all([
			prisma.votingOption.findUnique({
				where: { id: optionId },
				include: { category: true },
			}),
			getEventMessagingConfig(eventId),
		]);

		const channel = messagingConfig?.voteReceiptChannel || "whatsapp";
		if (channel === "none") return;

		let waSuccess = false;

		if (channel === "whatsapp" || channel === "whatsapp_sms") {
			try {
				const waRes = await sendVoteReceiptWhatsAppNotification({
					phone: voterPhone,
					voterName: metadata.voterName || undefined,
					nomineeName: option?.optionText || "Nominee",
					categoryName: option?.category?.name || undefined,
					votesCount: voteCount,
					reference,
				});
				waSuccess = waRes.success;
				if (waSuccess) {
					await prisma.vote.update({
						where: { id: vote.id },
						data: { whatsappSent: true },
					}).catch(() => {});
				}
			} catch (waErr) {
				console.error("[WhatsApp] Vote receipt failed:", waErr);
			}
		}

		if (channel === "sms" || (channel === "whatsapp_sms" && !waSuccess)) {
			try {
				const smsRes = await sendVoteReceiptSms({
					phone: voterPhone,
					voterName: metadata.voterName || undefined,
					nomineeName: option?.optionText || "Nominee",
					votesCount: voteCount,
					reference,
					eventId,
				});
				if (smsRes.success) {
					await prisma.vote.update({
						where: { id: vote.id },
						data: { smsSent: true },
					}).catch(() => {});
				}
			} catch (smsErr) {
				console.error("[SMS] Vote receipt failed:", smsErr);
			}
		}
	} catch (err) {
		console.error("[VoteFulfillment] Notification routing error:", err);
	}
}

