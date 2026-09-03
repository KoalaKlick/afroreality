import { prisma } from "@repo/db";
import { getSession } from "@/lib/session";

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

/**
 * Checks if a user is an organizer (owner, admin, or member) of the given organization.
 */
async function isUserOrgOrganizer(
	slugOrId: string,
	userId?: string | null,
): Promise<boolean> {
	if (!userId) return false;

	try {
		// `slugOrId` may be an org slug (non-UUID) or an org id (UUID). Passing a
		// slug into the `id` comparison would make Postgres throw
		// "invalid input syntax for type uuid", so branch on the shape first.
		const isUuid =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
				slugOrId,
			);

		const org = await prisma.organization.findFirst({
			where: isUuid ? { id: slugOrId } : { slug: slugOrId },
			select: {
				id: true,
				createdBy: true,
				team: {
					where: { userId },
					select: { id: true, role: true },
				},
			},
		});

		if (!org) return false;
		return org.createdBy === userId || org.team.length > 0;
	} catch {
		return false;
	}
}

export async function getPublicOrganizationProfile(
	slug: string,
	userId?: string | null,
): Promise<any> {
	try {
		let currentUserId = userId;
		if (currentUserId === undefined) {
			const session = await getSession();
			currentUserId = session?.userId ?? null;
		}

		const isOrganizer = await isUserOrgOrganizer(slug, currentUserId);

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
					// Organizers see all events (including drafts and hidden/isPublic: false).
					// The public only sees published/active events where visibility is on (isPublic: true).
					where: isOrganizer
						? undefined
						: {
							isPublic: true,
							status: {
								not: "draft",
							},
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
				events: sanitized.events?.length ?? 0,
			},
			isOrganizer,
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
	userId?: string | null,
): Promise<any> {
	try {
		let currentUserId = userId;
		if (currentUserId === undefined) {
			const session = await getSession();
			currentUserId = session?.userId ?? null;
		}

		const isOrganizer = await isUserOrgOrganizer(orgSlug, currentUserId);

		// Non-organizers must satisfy: isPublic === true AND status !== 'draft'
		const eventWhere: any = {
			slug: eventSlug,
			organization: {
				slug: orgSlug,
			},
		};

		if (!isOrganizer) {
			eventWhere.isPublic = true;
			eventWhere.status = { not: "draft" };
		}

		const event = await prisma.event.findFirst({
			where: eventWhere,
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
						socialLinks: {
							orderBy: {
								createdAt: "asc",
							},
						},
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
			isOrganizer,
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
	userId?: string | null,
): Promise<any> {
	try {
		let currentUserId = userId;
		if (currentUserId === undefined) {
			const session = await getSession();
			currentUserId = session?.userId ?? null;
		}

		const isOrganizer = await isUserOrgOrganizer(orgSlug, currentUserId);

		const eventWhere: any = {
			slug: eventSlug,
			organization: {
				slug: orgSlug,
			},
		};

		if (!isOrganizer) {
			eventWhere.isPublic = true;
			eventWhere.status = { not: "draft" };
		}

		const event = await prisma.event.findFirst({
			where: eventWhere,
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
						socialLinks: {
							orderBy: {
								createdAt: "asc",
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
			isOrganizer,
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
