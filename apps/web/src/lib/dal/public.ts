import { prisma } from "@repo/db";

export async function getPublicOrganizationProfile(
	slug: string,
): Promise<any> {
	try {
		const org = await prisma.organization.findUnique({
			where: { slug },
			select: {
				id: true,
				name: true,
				slug: true,
				description: true,
				logoUrl: true,
				bannerUrl: true,
				websiteUrl: true,
				contactEmail: true,
				primaryColor: true,
				secondaryColor: true,
				tertiaryColor: true,
				allowJoinRequests: true,
				_count: {
					select: {
						team: true,
						events: true,
					},
				},
				events: {
					where: {
						isPublic: true,
					},
					orderBy: {
						startDate: "desc",
					},
				},
			},
		});

		if (!org) return null;

		return {
			...org,
			_count: {
				members: org._count?.team ?? 0,
				events: org._count?.events ?? 0,
			},
			isUserPendingJoin: false,
		};
	} catch (error) {
		console.error("Error fetching public organization profile:", error);
		return null;
	}
}

export async function getPublicEventDetails(
	orgSlug: string,
	eventSlug: string,
): Promise<any> {
	try {
		const event = await prisma.event.findFirst({
			where: {
				slug: eventSlug,
				isPublic: true,
				organization: {
					slug: orgSlug,
				},
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
						bannerUrl: true,
						primaryColor: true,
						secondaryColor: true,
						tertiaryColor: true,
						contactEmail: true,
						websiteUrl: true,
					},
				},
				ticketTypes: {
					where: {
						status: "available",
					},
					orderBy: {
						orderIdx: "asc",
					},
				},
				votingCategories: {
					orderBy: {
						orderIdx: "asc",
					},
					include: {
						votingOptions: {
							orderBy: {
								orderIdx: "asc",
							},
						},
					},
				},
				sponsors: {
					orderBy: {
						createdAt: "asc",
					},
				},
				galleryLinks: {
					orderBy: {
						createdAt: "asc",
					},
				},
			},
		});

		if (!event) return null;

		return {
			...event,
			votingMode:
				(event as any).votingMode ||
				(event.type === "voting" ? "general" : "general"),
			bannerUrl: event.bannerImage,
			flierUrl: event.flierImage,
		};
	} catch (error) {
		console.error("Error fetching public event details:", error);
		return null;
	}
}

export async function getPublicCategoryDetails(
	orgSlug: string,
	eventSlug: string,
	categoryId: string,
): Promise<any> {
	try {
		const event = await prisma.event.findFirst({
			where: {
				slug: eventSlug,
				isPublic: true,
				organization: {
					slug: orgSlug,
				},
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
						primaryColor: true,
						secondaryColor: true,
					},
				},
			},
		});

		if (!event) return null;

		const category = await prisma.votingCategory.findFirst({
			where: {
				id: categoryId,
				eventId: event.id,
			},
			include: {
				votingOptions: {
					orderBy: {
						orderIdx: "asc",
					},
				},
			},
		});

		if (!category) return null;

		return {
			event: {
				...event,
				votingMode: (event as any).votingMode || "general",
				bannerUrl: event.bannerImage,
				flierUrl: event.flierImage,
			},
			category,
		};
	} catch (error) {
		console.error("Error fetching public category details:", error);
		return null;
	}
}
