import { prisma } from "@repo/db";
import { sendVoteReceiptWhatsAppNotification } from "@/lib/services/whatsapp";

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

	await prisma.vote.create({
		data: { eventId, optionId, categoryId: categoryId || null, paymentId: payment.id, voteCount, voterPhone, voterEmail },
	});

	await prisma.votingOption.update({
		where: { id: optionId },
		data: { votesCount: { increment: voteCount } },
	});

	if (!voterPhone) return;

	try {
		const option = await prisma.votingOption.findUnique({
			where: { id: optionId },
			include: { category: true },
		});
		await sendVoteReceiptWhatsAppNotification({
			phone: voterPhone,
			voterName: metadata.voterName || undefined,
			nomineeName: option?.optionText || "Nominee",
			categoryName: option?.category?.name || undefined,
			votesCount: voteCount,
			reference,
		});
	} catch (waErr) {
		console.error("[WhatsApp] Vote receipt failed:", waErr);
	}
}
