import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	context: { params: Promise<{ categoryId: string }> }
) {
	try {
		const { categoryId } = await context.params;
		if (!categoryId) {
			return NextResponse.redirect(new URL("/", request.url));
		}

		const category = await prisma.votingCategory.findUnique({
			where: { id: categoryId },
			select: {
				id: true,
				event: {
					select: {
						slug: true,
						organization: {
							select: {
								slug: true,
							},
						},
					},
				},
			},
		});

		if (!category || !category.event?.organization?.slug) {
			return NextResponse.redirect(new URL("/", request.url));
		}

		const targetUrl = new URL(
			`/${category.event.organization.slug}/event/${category.event.slug}/category/${category.id}`,
			request.url
		);

		return NextResponse.redirect(targetUrl, 307);
	} catch (error) {
		console.error("[CategoryRedirect] Error redirecting to category:", error);
		return NextResponse.redirect(new URL("/", request.url));
	}
}
