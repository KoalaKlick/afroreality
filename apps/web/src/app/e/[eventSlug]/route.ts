import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	context: { params: Promise<{ eventSlug: string }> }
) {
	try {
		const { eventSlug } = await context.params;
		if (!eventSlug) {
			return NextResponse.redirect(new URL("/", request.url));
		}

		const event = await prisma.event.findFirst({
			where: { slug: eventSlug },
			select: {
				slug: true,
				organization: {
					select: {
						slug: true,
					},
				},
			},
		});

		if (!event || !event.organization?.slug) {
			return NextResponse.redirect(new URL("/", request.url));
		}

		const targetUrl = new URL(
			`/${event.organization.slug}/event/${event.slug}`,
			request.url
		);

		return NextResponse.redirect(targetUrl, 307);
	} catch (error) {
		console.error("[EventRedirect] Error redirecting to event:", error);
		return NextResponse.redirect(new URL("/", request.url));
	}
}
