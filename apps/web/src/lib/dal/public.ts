import { prisma } from "@repo/db";

function sanitizePrismaData<T>(data: T): T {
	if (!data) return data;
	return JSON.parse(
		JSON.stringify(data, (_, value) => {
			// Convert BigInt to string if present
			if (typeof value === "bigint") {
				return value.toString();
			}
			return value;
		}),
	);
}

export async function getPublicOrganizationProfile(
	slug: string,
): Promise<any> {
	try {
		const org = await prisma.organization.findUnique({
			where: { slug },
			include: {
				socialLinks: {
					orderBy: {
						createdAt: "asc",
					},
				},
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
					include: {
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
						socialLinks: {
							orderBy: {
								createdAt: "asc",
							},
						},
					},
				},
			},
		});

		if (!org) return null;

		const sanitized = sanitizePrismaData(org);

		return {
			...sanitized,
			_count: {
				members: sanitized._count?.team ?? 0,
				events: sanitized._count?.events ?? 0,
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
						phone: true,
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
				socialLinks: {
					orderBy: {
						createdAt: "asc",
					},
				},
			},
		});

		if (!event) return null;

		const flier = event.flierImage || event.bannerImage;
		const banner = event.bannerImage || event.flierImage;

		const sanitized = sanitizePrismaData(event);

		// Ensure all nested decimals in votingCategories and ticketTypes are plain numbers
		const sanitizedVotingCategories = (sanitized.votingCategories || []).map(
			(cat: any) => ({
				...cat,
				votePrice: cat.votePrice ? Number(cat.votePrice) : 0,
				nominationPrice: cat.nominationPrice ? Number(cat.nominationPrice) : 0,
			}),
		);

		const sanitizedTicketTypes = (sanitized.ticketTypes || []).map(
			(ticket: any) => ({
				...ticket,
				price: ticket.price ? Number(ticket.price) : 0,
			}),
		);

		return {
			...sanitized,
			votingCategories: sanitizedVotingCategories,
			ticketTypes: sanitizedTicketTypes,
			votingMode:
				(sanitized as any).votingMode ||
				(sanitized.type === "voting" ? "general" : "general"),
			bannerUrl: banner,
			flierUrl: flier,
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
						bannerUrl: true,
						primaryColor: true,
						secondaryColor: true,
						tertiaryColor: true,
						contactEmail: true,
						websiteUrl: true,
						phone: true,
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
				socialLinks: {
					orderBy: {
						createdAt: "asc",
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

		const flier = event.flierImage || event.bannerImage;
		const banner = event.bannerImage || event.flierImage;

		const sanitizedEvent = sanitizePrismaData(event);
		const sanitizedCategory = sanitizePrismaData(category);

		return {
			event: {
				...sanitizedEvent,
				votingMode: (sanitizedEvent as any).votingMode || "general",
				bannerUrl: banner,
				flierUrl: flier,
			},
			category: {
				...sanitizedCategory,
				votePrice: sanitizedCategory.votePrice
					? Number(sanitizedCategory.votePrice)
					: 0,
				nominationPrice: sanitizedCategory.nominationPrice
					? Number(sanitizedCategory.nominationPrice)
					: 0,
			},
		};
	} catch (error) {
		console.error("Error fetching public category details:", error);
		return null;
	}
}
