import { prisma } from "@repo/db";
import { sendVoteReceiptWhatsAppNotification } from "@/lib/services/whatsapp";
import { sendVoteReceiptSms } from "@/lib/services/sms";
import { getEventMessagingConfig } from "@/lib/server-functions/event-messaging-config";
import { resolvePayerName } from "@/lib/server-functions/fulfillment/payer-name";

export async function fulfillVotePurchase({
	payment,
	metadata,
	reference,
	paystackData,
}: {
	payment: any;
	metadata: any;
	reference: string;
	paystackData?: any;
}): Promise<void> {
	const optionId = metadata.optionId || metadata.votingOptionId;
	const categoryId = metadata.categoryId;
	const eventId = metadata.eventId;
	const voteCount = Math.max(1, Number(metadata.voteCount) || Number(metadata.quantity) || 1);
	const voterPhone =
		metadata.voterPhone ||
		metadata.phoneNumber ||
		metadata.buyerPhone ||
		metadata.recipientPhone ||
		metadata.attendeePhone ||
		metadata.phone ||
		metadata.phone_number ||
		paystackData?.customer?.phone ||
		(payment.email && payment.email.endsWith("@fextiva.com") ? payment.email.split("@")[0] : null) ||
		null;
	const voterEmail = metadata.voterEmail || (payment.email && !payment.email.endsWith("@fextiva.com") ? payment.email : null);

	if (!optionId || !eventId) return;

	const [option, messagingConfig] = await Promise.all([
		prisma.votingOption.findUnique({
			where: { id: optionId },
			include: { category: true },
		}),
		getEventMessagingConfig(eventId),
	]);

	const effectiveCategoryId = categoryId || option?.categoryId || null;

	const vote = await prisma.vote.create({
		data: {
			eventId,
			optionId,
			categoryId: effectiveCategoryId,
			paymentId: payment.id,
			voteCount,
			voterPhone,
			voterEmail,
		},
	});

	await prisma.votingOption.update({
		where: { id: optionId },
		data: { votesCount: { increment: voteCount } },
	});

	if (!voterPhone) {
		console.warn(`[VoteFulfillment] No voter phone detected for receipt dispatch (ref: ${reference})`);
		return;
	}

	try {
		const channel = messagingConfig?.voteReceiptChannel || "whatsapp";
		if (channel === "none") return;

		const isUssd =
			metadata.channel === "ussd" ||
			metadata.source === "ussd" ||
			reference.startsWith("USSD_") ||
			reference.startsWith("USSD-") ||
			reference.startsWith("JUNIPAY_") ||
			reference.startsWith("HUBTEL_");

		const resolvedVoterName =
			metadata.voterName ||
			metadata.buyerName ||
			(await resolvePayerName({ paystackData, phone: voterPhone })) ||
			undefined;

		let waSuccess = false;

		if (channel === "whatsapp" || channel === "whatsapp_sms") {
			try {
				const waRes = await sendVoteReceiptWhatsAppNotification({
					phone: voterPhone,
					voterName: resolvedVoterName,
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
				} else {
					console.warn("[WhatsApp] Vote receipt failed:", waRes.error);
				}
			} catch (waErr) {
				console.error("[WhatsApp] Vote receipt failed:", waErr);
			}
		}

		// Fallback to SMS if channel is sms, or whatsapp_sms failed, or whatsapp failed (especially for USSD voters or delivery failure)
		const shouldSendSms =
			channel === "sms" ||
			(channel === "whatsapp_sms" && !waSuccess) ||
			(!waSuccess && (isUssd || channel === "whatsapp"));

		if (shouldSendSms) {
			try {
				const smsRes = await sendVoteReceiptSms({
					phone: voterPhone,
					voterName: resolvedVoterName,
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
				} else {
					console.warn("[SMS] Vote receipt failed:", smsRes.error);
				}
			} catch (smsErr) {
				console.error("[SMS] Vote receipt failed:", smsErr);
			}
		}

		// Flag notification sent on payment metadata
		await prisma.payment.update({
			where: { id: payment.id },
			data: {
				metadata: {
					...metadata,
					voteNotificationSent: true,
					voterPhone,
				},
			},
		}).catch(() => {});
	} catch (err) {
		console.error("[VoteFulfillment] Notification routing error:", err);
	}
}

