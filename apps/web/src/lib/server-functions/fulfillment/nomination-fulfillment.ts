import { prisma } from "@repo/db";
import { generateNomineeCode } from "@/lib/server-functions/voting-options";
import { sendNominationConfirmationEmail } from "@/lib/email/nomination";
import { getFrontendBaseUrl } from "@/lib/utils";

export async function fulfillNomination({
	payment,
	metadata,
}: {
	payment: any;
	metadata: any;
}): Promise<void> {
	let optionId = metadata.optionId || metadata.nomineeId;
	let option: any = null;

	if (optionId) {
		option = await prisma.votingOption.findUnique({
			where: { id: optionId },
			include: { category: true, event: { include: { organization: true } } },
		});
	}

	if (!option && metadata.eventId && metadata.categoryId && metadata.nomineeName) {
		const category = await prisma.votingCategory.findUnique({
			where: { id: metadata.categoryId },
		});
		const requireApproval = category?.requireApproval ?? true;
		const deletionCode = Math.floor(100000 + Math.random() * 900000).toString();
		const nomineeCode = await generateNomineeCode(metadata.eventId, metadata.categoryId, category?.name);

		option = await prisma.votingOption.create({
			data: {
				eventId: metadata.eventId,
				categoryId: metadata.categoryId,
				optionText: String(metadata.nomineeName).trim(),
				email: metadata.nomineeEmail || null,
				description: metadata.nomineeBio || metadata.description || null,
				imageUrl: metadata.nomineeImageUrl || metadata.imageUrl || null,
				nominatedByName: metadata.nominatorName || null,
				nominatedByEmail: metadata.nominatorEmail || payment.email || null,
				status: (requireApproval ? "pending" : "approved") as any,
				isPublicNomination: true,
				nomineeCode,
				deletionCode,
			},
			include: { category: true, event: { include: { organization: true } } },
		});
		metadata.optionId = option.id;
	} else if (option) {
		const requireApproval = option.category?.requireApproval ?? true;
		const deletionCode = option.deletionCode || Math.floor(100000 + Math.random() * 900000).toString();
		option = await prisma.votingOption.update({
			where: { id: option.id },
			data: { status: (requireApproval ? "pending" : "approved") as any, deletionCode },
			include: { category: true, event: { include: { organization: true } } },
		});
	}

	if (!option) return;

	const recipientEmail = option.nominatedByEmail || option.email || payment.email;
	if (!recipientEmail) return;

	const org = option.event?.organization;
	sendNominationConfirmationEmail({
		email: recipientEmail,
		recipientName: option.nominatedByName || recipientEmail,
		nomineeName: option.optionText,
		categoryName: option.category?.name || "Category",
		eventName: option.event?.title || "Event",
		deletionCode: option.status === "approved" ? option.deletionCode : null,
		organizationName: org?.name || "Fextiva",
		bannerUrl: option.event?.bannerImage || option.event?.flierImage,
		eventUrl: option.event?.slug ? `${getFrontendBaseUrl()}/event/${option.event.slug}` : undefined,
		orgColors: org ? { primary: org.primaryColor || undefined, secondary: org.secondaryColor || undefined, tertiary: org.tertiaryColor || undefined } : undefined,
	}).catch((err) => console.error("[EMAIL] Nomination email failed:", err));
}
