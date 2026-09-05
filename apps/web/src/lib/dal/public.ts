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

		let isUserPendingJoin = false;
		if (currentUserId && org.id) {
			const pendingReq = await prisma.membershipRequest.findFirst({
				where: {
					organizationId: org.id,
					userId: currentUserId,
					status: "pending",
				},
				select: { id: true },
			});
			isUserPendingJoin = !!pendingReq;
		}

		const sanitized = sanitizePrismaData(org);

		return {
			...sanitized,
			_count: {
				members: sanitized._count?.team ?? 0,
				events: sanitized.events?.length ?? 0,
			},
			isOrganizer,
			isUserPendingJoin,
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
							where: isOrganizer ? undefined : { status: "approved" },
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
					where: isOrganizer ? undefined : { status: "approved" },
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

export interface GetPublicEventsOptions {
	limit?: number;
	offset?: number;
	query?: string;
	type?: string;
	category?: string;
	orgSlug?: string;
	sort?: "upcoming" | "recent" | "popular";
}

export async function getPublicEventsList(options: GetPublicEventsOptions = {}) {
	try {
		const {
			limit = 24,
			offset = 0,
			query,
			type,
			orgSlug,
			sort = "upcoming",
		} = options;

		const now = new Date();
		const andConditions: any[] = [{ isPublic: true }];

		if (!orgSlug) {
			// In public discovery / landing page, only show active events (not ended or cancelled)
			andConditions.push({ status: { in: ["published", "ongoing"] } });
			andConditions.push({
				OR: [
					{ endDate: null },
					{ endDate: { gte: now } },
				],
			});
		} else {
			// On the organization's page, show all public events (including past/ended archives)
			andConditions.push({ organization: { slug: orgSlug } });
			andConditions.push({ status: { not: "draft" } });
		}

		if (type && type !== "all") {
			andConditions.push({ type });
		}

		if (query && query.trim()) {
			const cleanQuery = query.trim();
			andConditions.push({
				OR: [
					{ title: { contains: cleanQuery, mode: "insensitive" } },
					{ description: { contains: cleanQuery, mode: "insensitive" } },
					{ venueCity: { contains: cleanQuery, mode: "insensitive" } },
					{ venueCountry: { contains: cleanQuery, mode: "insensitive" } },
					{ category: { contains: cleanQuery, mode: "insensitive" } },
					{ organization: { name: { contains: cleanQuery, mode: "insensitive" } } },
				],
			});
		}

		const where: any = { AND: andConditions };

		let orderBy: any = { startDate: "asc" };
		if (sort === "recent") {
			orderBy = { createdAt: "desc" };
		} else if (sort === "popular") {
			orderBy = { createdAt: "desc" };
		}

		const [events, total] = await Promise.all([
			prisma.event.findMany({
				where,
				take: limit,
				skip: offset,
				orderBy,
				include: {
					organization: {
						select: {
							id: true,
							name: true,
							slug: true,
							logoUrl: true,
							primaryColor: true,
						},
					},
					ticketTypes: {
						where: {
							status: "available",
						},
						select: {
							id: true,
							name: true,
							price: true,
						},
						orderBy: {
							price: "asc",
						},
					},
					_count: {
						select: {
							ticketOrders: true,
							votes: true,
							votingCategories: true,
						},
					},
				},
			}),
			prisma.event.count({ where }),
		]);

		const sanitized = sanitizePrismaData(events);

		const formattedEvents = sanitized.map((evt: any) => {
			const flier = evt.flierImage || evt.bannerImage;
			const banner = evt.bannerImage || evt.flierImage;
			const ticketPrices = (evt.ticketTypes || []).map((t: any) => Number(t.price || 0));
			const minPrice = ticketPrices.length > 0 ? Math.min(...ticketPrices) : null;
			const maxPrice = ticketPrices.length > 0 ? Math.max(...ticketPrices) : null;

			return {
				...evt,
				flierUrl: flier,
				bannerUrl: banner,
				minPrice,
				maxPrice,
			};
		});

		return {
			events: formattedEvents,
			total,
			limit,
			offset,
		};
	} catch (error) {
		console.error("Error fetching public events list:", error);
		return { events: [], total: 0, limit: options.limit ?? 24, offset: 0 };
	}
}

export interface GetPublicOrganizersOptions {
	limit?: number;
	offset?: number;
	query?: string;
}

export async function getPublicOrganizersList(options: GetPublicOrganizersOptions = {}) {
	try {
		const { limit = 20, offset = 0, query } = options;

		const where: any = {
			events: {
				some: {
					isPublic: true,
					status: { not: "draft" },
				},
			},
		};

		if (query && query.trim()) {
			const clean = query.trim();
			where.OR = [
				{ name: { contains: clean, mode: "insensitive" } },
				{ description: { contains: clean, mode: "insensitive" } },
			];
		}

		const [organizers, total] = await Promise.all([
			prisma.organization.findMany({
				where,
				take: limit,
				skip: offset,
				orderBy: {
					events: {
						_count: "desc",
					},
				},
				select: {
					id: true,
					name: true,
					slug: true,
					description: true,
					logoUrl: true,
					bannerUrl: true,
					primaryColor: true,
					websiteUrl: true,
					_count: {
						select: {
							events: {
								where: {
									isPublic: true,
									status: { not: "draft" },
								},
							},
						},
					},
				},
			}),
			prisma.organization.count({ where }),
		]);

		const sanitized = sanitizePrismaData(organizers);

		return {
			organizers: sanitized.map((org: any) => ({
				...org,
				eventsCount: org._count?.events ?? 0,
			})),
			total,
			limit,
			offset,
		};
	} catch (error) {
		console.error("Error fetching public organizers list:", error);
		return { organizers: [], total: 0, limit: options.limit ?? 20, offset: 0 };
	}
}

export async function getLandingStatsData() {
	try {
		const [totalEvents, totalOrganizers, totalTicketsSold, totalVotesResult] = await Promise.all([
			prisma.event.count({
				where: {
					isPublic: true,
					status: { not: "draft" },
				},
			}).catch(() => 0),
			prisma.organization.count({
				where: {
					events: {
						some: {
							isPublic: true,
							status: { not: "draft" },
						},
					},
				},
			}).catch(() => 0),
			prisma.ticket.count({
				where: {
					order: {
						status: "completed",
					},
				},
			}).catch(() => 0),
			prisma.vote.aggregate({
				_sum: { voteCount: true },
			}).catch(() => ({ _sum: { voteCount: null } })),
		]);

		return {
			totalEvents: totalEvents || 120,
			totalOrganizers: totalOrganizers || 45,
			totalTicketsSold: totalTicketsSold || 8500,
			totalVotes: Number(totalVotesResult?._sum?.voteCount ?? 24000),
		};
	} catch (error) {
		console.error("Error fetching landing stats data:", error);
		return {
			totalEvents: 120,
			totalOrganizers: 45,
			totalTicketsSold: 8500,
			totalVotes: 24000,
		};
	}
}

export async function getActiveFextivaEvents() {
	try {
		const events = await prisma.event.findMany({
			where: {
				isPublic: true,
				status: {
					in: ["published", "ongoing", "ended"],
				},
			},
			select: {
				id: true,
				slug: true,
				title: true,
				type: true,
				startDate: true,
				updatedAt: true,
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						updatedAt: true,
					},
				},
				votingCategories: {
					select: {
						id: true,
						updatedAt: true,
					},
				},
			},
			orderBy: {
				updatedAt: "desc",
			},
			take: 2000,
		});

		return events;
	} catch (error) {
		console.error("Error fetching active Fextiva events for sitemap:", error);
		return [];
	}
}

export async function getActiveFextivaOrganizations() {
	try {
		const orgs = await prisma.organization.findMany({
			where: {
				events: {
					some: {
						isPublic: true,
						status: {
							in: ["published", "ongoing", "ended"],
						},
					},
				},
			},
			select: {
				slug: true,
				updatedAt: true,
			},
			take: 500,
		});
		return orgs;
	} catch {
		return [];
	}
}

