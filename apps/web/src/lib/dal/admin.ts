// src/lib/dal/admin.ts
//
// Data Access Layer for Platform Super Admin oversight.
// Provides authoritative platform-wide queries for organizations, members,
// event schedules/statuses/amounts, wallet balances, and company platform share vs organizer share.

import { prisma } from "@repo/db";
import { isTPlusOneSettled } from "@/lib/utils/settlement";

export interface AdminOverviewStats {
	totalOrganizers: number;
	totalMembers: number;
	totalEvents: number;
	eventsByStatus: {
		ongoing: number;
		published: number;
		ended: number;
		draft: number;
		cancelled: number;
	};
	totalGrossVolume: {
		GHS: number;
		USD: number;
		NGN: number;
	};
	totalPlatformShare: {
		GHS: number;
		USD: number;
		NGN: number;
	};
	totalOrganizerShare: {
		GHS: number;
		USD: number;
		NGN: number;
	};
	totalWalletFloat: {
		GHS: number;
		USD: number;
		NGN: number;
	};
	totalLockedWallets: number;
	ongoingEvents: Array<{
		id: string;
		title: string;
		slug: string;
		type: string;
		status: string;
		startDate: string | null;
		endDate: string | null;
		venueName: string | null;
		venueCity: string | null;
		organization: {
			id: string;
			name: string;
			slug: string;
			logoUrl: string | null;
		};
		ticketsSold: number;
		grossRevenue: number;
		ourShare: number;
		organizerShare: number;
	}>;
	recentTransactions: Array<{
		id: string;
		reference: string;
		amount: number;
		feeAmount: number;
		currency: string;
		type: string;
		category: string;
		status: string;
		description: string | null;
		createdAt: string;
		organizationName: string;
	}>;
}

export async function getAdminOverviewData(): Promise<AdminOverviewStats> {
	const now = new Date();

	const [
		totalOrganizers,
		totalMembers,
		events,
		wallets,
		payments,
		recentTxList,
	] = await Promise.all([
		prisma.organization.count(),
		prisma.teamMember.count(),
		prisma.event.findMany({
			select: {
				id: true,
				title: true,
				slug: true,
				type: true,
				status: true,
				startDate: true,
				endDate: true,
				venueName: true,
				venueCity: true,
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
					},
				},
				ticketOrders: {
					where: { status: "completed" },
					select: {
						subtotal: true,
						tickets: { select: { id: true } },
						payment: {
							select: { metadata: true },
						},
					},
				},
				votes: {
					select: {
						voteCount: true,
						payment: {
							select: {
								amount: true,
								status: true,
								metadata: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.wallet.findMany({
			select: {
				balance: true,
				currency: true,
				isLocked: true,
				organizationId: true,
			},
		}),
		prisma.payment.findMany({
			where: { status: "completed" },
			select: {
				amount: true,
				currency: true,
				metadata: true,
			},
		}),
		prisma.transaction.findMany({
			take: 8,
			orderBy: { createdAt: "desc" },
			include: {
				wallet: {
					include: {
						organization: {
							select: { name: true },
						},
					},
				},
			},
		}),
	]);

	// Events status breakdown
	const eventsByStatus = {
		ongoing: 0,
		published: 0,
		ended: 0,
		draft: 0,
		cancelled: 0,
	};

	const ongoingEventsList: AdminOverviewStats["ongoingEvents"] = [];

	// Build map of completed payments by event ID (includes tickets, votes, nominations, and custom payments)
	const paymentsByEvent = new Map<string, { gross: number; platformFee: number; organizerReceives: number }[]>();
	for (const p of payments) {
		const meta = (p.metadata as any) || {};
		const evId = meta.eventId || meta.event_id;
		if (evId) {
			const base = Number(meta.baseAmount ?? p.amount ?? 0);
			const fee = Number(meta.platformFee ?? 0);
			const orgRcv = Number(meta.organizerReceives ?? (base - fee));
			if (!paymentsByEvent.has(evId)) {
				paymentsByEvent.set(evId, []);
			}
			paymentsByEvent.get(evId)!.push({ gross: base, platformFee: fee, organizerReceives: orgRcv });
		}
	}

	for (const ev of events) {
		const st = ev.status as keyof typeof eventsByStatus;
		if (eventsByStatus[st] !== undefined) {
			eventsByStatus[st]++;
		}

		// Check if event is ongoing or active
		const isCurrentlyOngoing =
			ev.status === "ongoing" ||
			(ev.status === "published" &&
				ev.startDate &&
				new Date(ev.startDate) <= now &&
				(!ev.endDate || new Date(ev.endDate) >= now));

		if (isCurrentlyOngoing || ev.status === "ongoing") {
			// Read exact amounts from payment metadata (single source of truth)
			let eventGross = 0;
			let eventPlatformFee = 0;
			let eventOrgReceives = 0;

			if (paymentsByEvent.has(ev.id)) {
				const evPayments = paymentsByEvent.get(ev.id)!;
				for (const ep of evPayments) {
					eventGross += ep.gross;
					eventPlatformFee += ep.platformFee;
					eventOrgReceives += ep.organizerReceives;
				}
			} else {
				// Ticket revenue — read metadata from the linked payment
				for (const o of ev.ticketOrders) {
					const base = Number(o.subtotal || 0);
					const meta = (o as any).payment?.metadata as any;
					if (meta) {
						eventGross += Number(meta.baseAmount ?? base);
						eventPlatformFee += Number(meta.platformFee ?? 0);
						eventOrgReceives += Number(meta.organizerReceives ?? (base - Number(meta.platformFee ?? 0)));
					} else {
						eventGross += base;
					}
				}

				// Vote revenue — read metadata from the linked payment
				for (const v of ev.votes) {
					if (v.payment && v.payment.status === "completed") {
						const meta = (v.payment.metadata as any) || {};
						const base = Number(meta.baseAmount ?? v.payment.amount ?? 0);
						const pFee = Number(meta.platformFee ?? 0);
						const orgRcv = Number(meta.organizerReceives ?? (base - pFee));

						eventGross += base;
						eventPlatformFee += pFee;
						eventOrgReceives += orgRcv;
					}
				}
			}

			const ticketsSold = ev.ticketOrders.reduce(
				(sum: number, o: { tickets: any[] }) => sum + (o.tickets?.length || 0),
				0
			);

			// Fallback to 5% only for legacy payments without metadata
			const ourShare = eventPlatformFee > 0
				? Number(eventPlatformFee.toFixed(2))
				: Number((eventGross * 0.05).toFixed(2));
			const organizerShare = eventOrgReceives > 0
				? Number(eventOrgReceives.toFixed(2))
				: Number((eventGross - ourShare).toFixed(2));

			ongoingEventsList.push({
				id: ev.id,
				title: ev.title,
				slug: ev.slug,
				type: ev.type,
				status: ev.status,
				startDate: ev.startDate ? ev.startDate.toISOString() : null,
				endDate: ev.endDate ? ev.endDate.toISOString() : null,
				venueName: ev.venueName,
				venueCity: ev.venueCity,
				organization: ev.organization,
				ticketsSold,
				grossRevenue: eventGross,
				ourShare,
				organizerShare,
			});
		}
	}

	// Gross volume, platform share, and organizer share breakdown
	const totalGrossVolume = { GHS: 0, USD: 0, NGN: 0 };
	const totalPlatformShare = { GHS: 0, USD: 0, NGN: 0 };
	const totalOrganizerShare = { GHS: 0, USD: 0, NGN: 0 };

	for (const p of payments) {
		const curr = (p.currency || "GHS") as keyof typeof totalGrossVolume;
		const meta = (p.metadata as any) || {};

		const baseAmt = Number(meta.baseAmount ?? p.amount ?? 0);
		let pFee = Number(meta.platformFee ?? 0);
		if (pFee === 0 && baseAmt > 0) {
			pFee = Number((baseAmt * 0.05).toFixed(2));
		}
		const orgShare = Number(meta.organizerReceives ?? (baseAmt - pFee));

		if (totalGrossVolume[curr] !== undefined) {
			totalGrossVolume[curr] += baseAmt;
			totalPlatformShare[curr] += pFee;
			totalOrganizerShare[curr] += orgShare;
		} else {
			totalGrossVolume.GHS += baseAmt;
			totalPlatformShare.GHS += pFee;
			totalOrganizerShare.GHS += orgShare;
		}
	}

	// Wallet float breakdown
	const totalWalletFloat = { GHS: 0, USD: 0, NGN: 0 };
	let totalLockedWallets = 0;
	for (const w of wallets) {
		if (w.organizationId) {
			const curr = (w.currency || "GHS") as keyof typeof totalWalletFloat;
			const bal = Number(w.balance || 0);
			if (totalWalletFloat[curr] !== undefined) {
				totalWalletFloat[curr] += bal;
			} else {
				totalWalletFloat.GHS += bal;
			}
			if (w.isLocked) {
				totalLockedWallets++;
			}
		}
	}

	const recentTransactions = recentTxList.map((tx) => ({
		id: tx.id,
		reference: tx.reference,
		amount: Number(tx.amount || 0),
		feeAmount: Number(tx.feeAmount || 0),
		currency: tx.currency,
		type: tx.type,
		category: tx.category,
		status: tx.status,
		description: tx.description,
		createdAt: tx.createdAt.toISOString(),
		organizationName: tx.wallet.organization?.name || "Organizer",
	}));

	return {
		totalOrganizers,
		totalMembers,
		totalEvents: events.length,
		eventsByStatus,
		totalGrossVolume,
		totalPlatformShare,
		totalOrganizerShare,
		totalWalletFloat,
		totalLockedWallets,
		ongoingEvents: ongoingEventsList.slice(0, 6),
		recentTransactions,
	};
}

export interface AdminOrganizerItem {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	logoUrl: string | null;
	contactEmail: string | null;
	phone: string | null;
	createdAt: string;
	autoPayout: boolean;
	subaccountCode: string | null;
	paystackBankCode: string | null;
	paystackAccountNumber: string | null;
	paystackAccountName: string | null;
	creator: {
		id: string;
		fullName: string;
		email: string;
		avatarUrl: string | null;
	} | null;
	members: Array<{
		id: string;
		role: string;
		joinedAt: string;
		user: {
			id: string;
			fullName: string;
			email: string;
			phone: string | null;
			avatarUrl: string | null;
		};
	}>;
	eventsSummary: {
		total: number;
		published: number;
		ongoing: number;
		ended: number;
		draft: number;
		eventsList: Array<{
			id: string;
			title: string;
			slug: string;
			type: string;
			status: string;
			startDate: string | null;
			endDate: string | null;
			ticketsSold: number;
			grossRevenue: number;
			ourShare: number;
			organizerShare: number;
		}>;
	};
	financials: {
		grossRevenue: number;
		ourPlatformShare: number;
		organizerNetShare: number;
		availableBalance?: number;
		pendingClearance?: number;
		walletBalance?: number;
	};
	wallet: {
		id: string;
		balance: number;
		currency: string;
		isActive: boolean;
		isLocked: boolean;
		lockReason: string | null;
		pendingCredits: number;
		pendingDebits: number;
		lastTransactionAt: string | null;
	} | null;
}

export async function getAdminOrganizersList(): Promise<AdminOrganizerItem[]> {
	const now = new Date();

	const [orgs, allPayments] = await Promise.all([
		prisma.organization.findMany({
			include: {
				creator: {
					select: {
						id: true,
						fullName: true,
						email: true,
						avatarUrl: true,
					},
				},
				team: {
					include: {
						user: {
							select: {
								id: true,
								fullName: true,
								email: true,
								phone: true,
								avatarUrl: true,
							},
						},
					},
					orderBy: { joinedAt: "asc" },
				},
				wallets: {
					orderBy: { createdAt: "desc" },
					take: 1,
					include: {
						transactions: {
							where: { status: "completed" },
							select: {
								type: true,
								amount: true,
								feeAmount: true,
								completedAt: true,
								createdAt: true,
							},
						},
					},
				},
				events: {
					select: {
						id: true,
						title: true,
						slug: true,
						type: true,
						status: true,
						startDate: true,
						endDate: true,
						ticketOrders: {
							where: { status: "completed" },
							select: {
								subtotal: true,
								tickets: { select: { id: true } },
								payment: {
									select: { metadata: true },
								},
							},
						},
						votes: {
							select: {
								voteCount: true,
								payment: {
									select: {
										amount: true,
										status: true,
										metadata: true,
									},
								},
							},
						},
					},
					orderBy: { createdAt: "desc" },
				},
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.payment.findMany({
			where: { status: "completed" },
			select: {
				amount: true,
				currency: true,
				metadata: true,
			},
		}),
	]);

	// Index completed payments by event ID (includes tickets, votes, nominations, and custom payments)
	const paymentsByEvent = new Map<string, { gross: number; platformFee: number; organizerReceives: number }[]>();
	for (const p of allPayments) {
		const meta = (p.metadata as any) || {};
		const evId = meta.eventId || meta.event_id;
		if (evId) {
			const base = Number(meta.baseAmount ?? p.amount ?? 0);
			const fee = Number(meta.platformFee ?? 0);
			const orgRcv = Number(meta.organizerReceives ?? (base - fee));
			if (!paymentsByEvent.has(evId)) {
				paymentsByEvent.set(evId, []);
			}
			paymentsByEvent.get(evId)!.push({ gross: base, platformFee: fee, organizerReceives: orgRcv });
		}
	}

	return orgs.map((org) => {
		const wallet = org.wallets[0] || null;

		let published = 0,
			ongoing = 0,
			ended = 0,
			draft = 0;

		let eventsGrossTotal = 0;
		let eventsFeeTotal = 0;

		const eventsList = org.events.map((ev) => {
			if (ev.status === "published") published++;
			else if (ev.status === "ongoing") ongoing++;
			else if (ev.status === "ended") ended++;
			else if (ev.status === "draft") draft++;

			// Read exact amounts from payment metadata (single source of truth)
			let evGross = 0;
			let evPlatformFee = 0;
			let evOrgReceives = 0;

			if (paymentsByEvent.has(ev.id)) {
				const evPayments = paymentsByEvent.get(ev.id)!;
				for (const ep of evPayments) {
					evGross += ep.gross;
					evPlatformFee += ep.platformFee;
					evOrgReceives += ep.organizerReceives;
				}
			} else {
				for (const o of ev.ticketOrders) {
					const base = Number(o.subtotal || 0);
					const meta = (o as any).payment?.metadata as any;
					if (meta) {
						evGross += Number(meta.baseAmount ?? base);
						evPlatformFee += Number(meta.platformFee ?? 0);
						evOrgReceives += Number(meta.organizerReceives ?? (base - Number(meta.platformFee ?? 0)));
					} else {
						evGross += base;
					}
				}

				for (const v of ev.votes) {
					if (v.payment && v.payment.status === "completed") {
						const meta = (v.payment.metadata as any) || {};
						const base = Number(meta.baseAmount ?? v.payment.amount ?? 0);
						const pFee = Number(meta.platformFee ?? 0);
						const orgRcv = Number(meta.organizerReceives ?? (base - pFee));
						evGross += base;
						evPlatformFee += pFee;
						evOrgReceives += orgRcv;
					}
				}
			}

			const ticketsSold = ev.ticketOrders.reduce(
				(sum: number, o: { tickets: any[] }) => sum + (o.tickets?.length || 0),
				0
			);

			// Fallback to 5% only for legacy payments without metadata
			const eventOurShare = evPlatformFee > 0
				? Number(evPlatformFee.toFixed(2))
				: Number((evGross * 0.05).toFixed(2));
			const eventOrgShare = evOrgReceives > 0
				? Number(evOrgReceives.toFixed(2))
				: Number((evGross - eventOurShare).toFixed(2));

			eventsGrossTotal += evGross;
			eventsFeeTotal += eventOurShare;

			return {
				id: ev.id,
				title: ev.title,
				slug: ev.slug,
				type: ev.type,
				status: ev.status,
				startDate: ev.startDate ? ev.startDate.toISOString() : null,
				endDate: ev.endDate ? ev.endDate.toISOString() : null,
				ticketsSold,
				grossRevenue: evGross,
				ourShare: eventOurShare,
				organizerShare: eventOrgShare,
			};
		});

		// Calculate organization financials directly from wallet transactions (single source of truth matching org wallet)
		const creditTxns = wallet?.transactions?.filter((t) => t.type === "credit") || [];
		let orgGross = 0;
		let orgPlatformFeeTotal = 0;
		let orgNetShare = 0;
		let clearedEarnings = 0;
		let pendingClearance = 0;

		if (creditTxns.length > 0) {
			orgNetShare = Math.round(creditTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0) * 100) / 100;
			orgPlatformFeeTotal = Math.round(creditTxns.reduce((sum, t) => sum + Number(t.feeAmount || 0), 0) * 100) / 100;
			orgGross = Math.round((orgNetShare + orgPlatformFeeTotal) * 100) / 100;

			for (const t of creditTxns) {
				const txDate = t.completedAt || t.createdAt || now;
				const amt = Number(t.amount || 0);
				if (isTPlusOneSettled(txDate, now)) {
					clearedEarnings += amt;
				} else {
					pendingClearance += amt;
				}
			}
		} else {
			orgGross = Math.round(eventsGrossTotal * 100) / 100;
			orgPlatformFeeTotal = Math.round(eventsFeeTotal * 100) / 100;
			orgNetShare = Math.round((orgGross - orgPlatformFeeTotal) * 100) / 100;
			clearedEarnings = orgNetShare;
		}

		const pendingDebits = Number(wallet?.pendingDebits || 0);
		const availableBalance = Math.round(Math.max(0, clearedEarnings - pendingDebits) * 100) / 100;
		const roundedPendingClearance = Math.round(pendingClearance * 100) / 100;

		return {
			id: org.id,
			name: org.name,
			slug: org.slug,
			description: org.description,
			logoUrl: org.logoUrl,
			contactEmail: org.contactEmail,
			phone: org.phone,
			createdAt: org.createdAt.toISOString(),
			autoPayout: org.autoPayout,
			subaccountCode: org.subaccountCode,
			paystackBankCode: org.paystackBankCode,
			paystackAccountNumber: org.paystackAccountNumber,
			paystackAccountName: org.paystackAccountName,
			creator: org.creator,
			members: org.team.map((m) => ({
				id: m.id,
				role: m.role,
				joinedAt: m.joinedAt.toISOString(),
				user: m.user,
			})),
			eventsSummary: {
				total: org.events.length,
				published,
				ongoing,
				ended,
				draft,
				eventsList,
			},
			financials: {
				grossRevenue: orgGross,
				ourPlatformShare: orgPlatformFeeTotal,
				organizerNetShare: orgNetShare,
				availableBalance,
				pendingClearance: roundedPendingClearance,
				walletBalance: Number(wallet?.balance || 0),
			},
			wallet: wallet
				? {
						id: wallet.id,
						balance: Number(wallet.balance || 0),
						currency: wallet.currency,
						isActive: wallet.isActive,
						isLocked: wallet.isLocked,
						lockReason: wallet.lockReason,
						pendingCredits: Number(wallet.pendingCredits || 0),
						pendingDebits: Number(wallet.pendingDebits || 0),
						lastTransactionAt: wallet.lastTransactionAt
							? wallet.lastTransactionAt.toISOString()
							: null,
				  }
				: null,
		};
	});
}

export interface AdminEventItem {
	id: string;
	title: string;
	slug: string;
	type: string;
	status: string;
	startDate: string | null;
	endDate: string | null;
	timezone: string;
	isPublic: boolean;
	venueName: string | null;
	venueCity: string | null;
	venueCountry: string;
	isVirtual: boolean;
	virtualLink: string | null;
	maxAttendees: number | null;
	registrationDeadline: string | null;
	hasUssd: boolean;
	ussdCode: string | null;
	createdAt: string;
	organization: {
		id: string;
		name: string;
		slug: string;
		logoUrl: string | null;
		contactEmail: string | null;
		phone: string | null;
	};
	creator: {
		fullName: string;
		email: string;
	} | null;
	ticketStats: {
		ticketsSold: number;
		revenue: number;
		ordersCount: number;
	};
	votingStats: {
		totalVotes: number;
		revenue: number;
	};
	nominationRevenue?: number;
	totalGrossRevenue: number;
	ourPlatformShare: number;
	organizerNetRevenue: number;
}

export async function getAdminEventsList(): Promise<AdminEventItem[]> {
	const [events, allPayments] = await Promise.all([
		prisma.event.findMany({
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
						contactEmail: true,
						phone: true,
					},
				},
				creator: {
					select: {
						fullName: true,
						email: true,
					},
				},
				ticketOrders: {
					where: { status: "completed" },
					select: {
						subtotal: true,
						tickets: { select: { id: true } },
						payment: {
							select: { metadata: true },
						},
					},
				},
				votes: {
					select: {
						voteCount: true,
						payment: {
							select: {
								amount: true,
								status: true,
								metadata: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.payment.findMany({
			where: { status: "completed" },
			select: {
				amount: true,
				currency: true,
				metadata: true,
			},
		}),
	]);

	// Index completed payments by event ID (includes tickets, votes, nominations, and custom payments)
	const paymentsByEvent = new Map<string, { gross: number; platformFee: number; organizerReceives: number; purpose?: string }[]>();
	for (const p of allPayments) {
		const meta = (p.metadata as any) || {};
		const evId = meta.eventId || meta.event_id;
		if (evId) {
			const base = Number(meta.baseAmount ?? p.amount ?? 0);
			const fee = Number(meta.platformFee ?? 0);
			const orgRcv = Number(meta.organizerReceives ?? (base - fee));
			if (!paymentsByEvent.has(evId)) {
				paymentsByEvent.set(evId, []);
			}
			paymentsByEvent.get(evId)!.push({ gross: base, platformFee: fee, organizerReceives: orgRcv, purpose: meta.purpose });
		}
	}

	return events.map((ev) => {
		// Read exact amounts from payment metadata (single source of truth)
		let totalGross = 0;
		let totalPlatformFee = 0;
		let totalOrgReceives = 0;
		let ticketRev = 0;
		let votingRev = 0;
		let nominationRev = 0;

		if (paymentsByEvent.has(ev.id)) {
			const evPayments = paymentsByEvent.get(ev.id)!;
			for (const ep of evPayments) {
				totalGross += ep.gross;
				totalPlatformFee += ep.platformFee;
				totalOrgReceives += ep.organizerReceives;
				if (ep.purpose === "ticket_purchase" || ep.purpose === "ticket") {
					ticketRev += ep.gross;
				} else if (ep.purpose === "nomination") {
					nominationRev += ep.gross;
				} else {
					votingRev += ep.gross;
				}
			}
		} else {
			for (const o of ev.ticketOrders) {
				const base = Number(o.subtotal || 0);
				const meta = (o as any).payment?.metadata as any;
				if (meta) {
					const metaBase = Number(meta.baseAmount ?? base);
					totalGross += metaBase;
					ticketRev += metaBase;
					totalPlatformFee += Number(meta.platformFee ?? 0);
					totalOrgReceives += Number(meta.organizerReceives ?? (metaBase - Number(meta.platformFee ?? 0)));
				} else {
					totalGross += base;
					ticketRev += base;
				}
			}

			for (const v of ev.votes) {
				if (v.payment && v.payment.status === "completed") {
					const meta = (v.payment.metadata as any) || {};
					const base = Number(meta.baseAmount ?? v.payment.amount ?? 0);
					const pFee = Number(meta.platformFee ?? 0);
					const orgRcv = Number(meta.organizerReceives ?? (base - pFee));
					totalGross += base;
					votingRev += base;
					totalPlatformFee += pFee;
					totalOrgReceives += orgRcv;
				}
			}
		}

		const ticketsSold = ev.ticketOrders.reduce(
			(sum: number, o: { tickets: any[] }) => sum + (o.tickets?.length || 0),
			0
		);

		const totalVotes = ev.votes.reduce(
			(sum: number, v: { voteCount: number }) => sum + Number(v.voteCount || 0),
			0
		);

		// Fallback to 5% only for legacy payments without metadata
		const ourPlatformShare = totalPlatformFee > 0
			? Number(totalPlatformFee.toFixed(2))
			: Number((totalGross * 0.05).toFixed(2));
		const organizerNetRevenue = totalOrgReceives > 0
			? Number(totalOrgReceives.toFixed(2))
			: Number((totalGross - ourPlatformShare).toFixed(2));

		return {
			id: ev.id,
			title: ev.title,
			slug: ev.slug,
			type: ev.type,
			status: ev.status,
			startDate: ev.startDate ? ev.startDate.toISOString() : null,
			endDate: ev.endDate ? ev.endDate.toISOString() : null,
			timezone: ev.timezone,
			isPublic: ev.isPublic,
			venueName: ev.venueName,
			venueCity: ev.venueCity,
			venueCountry: ev.venueCountry,
			isVirtual: ev.isVirtual,
			virtualLink: ev.virtualLink,
			maxAttendees: ev.maxAttendees,
			registrationDeadline: ev.registrationDeadline
				? ev.registrationDeadline.toISOString()
				: null,
			hasUssd: Boolean(ev.hasUssd),
			ussdCode: ev.ussdCode || null,
			createdAt: ev.createdAt.toISOString(),
			organization: ev.organization,
			creator: ev.creator,
			ticketStats: {
				ticketsSold,
				revenue: ticketRev,
				ordersCount: ev.ticketOrders.length,
			},
			votingStats: {
				totalVotes,
				revenue: votingRev,
			},
			nominationRevenue: nominationRev,
			totalGrossRevenue: totalGross,
			ourPlatformShare,
			organizerNetRevenue,
		};
	});
}

export interface AdminWalletItem {
	id: string;
	organizationId: string;
	organizationName: string;
	organizationSlug: string;
	organizationLogo: string | null;
	balance: number;
	currency: string;
	pendingCredits: number;
	pendingDebits: number;
	isActive: boolean;
	isLocked: boolean;
	lockReason: string | null;
	lastTransactionAt: string | null;
	createdAt: string;
	autoPayout: boolean;
	bankName: string | null;
	accountNumber: string | null;
	accountName: string | null;
}

export interface AdminPayoutItem {
	id: string;
	reference: string;
	amount: number;
	currency: string;
	feeAmount: number;
	status: string;
	recipientName: string;
	bankName: string | null;
	accountNumber: string | null;
	accountName: string | null;
	createdAt: string;
	approvedAt: string | null;
	processedAt: string | null;
	completedAt: string | null;
	approver: {
		fullName: string;
		email: string;
	} | null;
	wallet: {
		organization: {
			name: string;
			slug: string;
		} | null;
	} | null;
}

export async function getAdminWalletsList(): Promise<{
	wallets: AdminWalletItem[];
	recentPayouts: AdminPayoutItem[];
	floatSummary: {
		totalActiveGHS: number;
		totalLockedGHS: number;
		pendingDebitsGHS: number;
		pendingCreditsGHS: number;
	};
}> {
	const [walletsData, payoutsData] = await Promise.all([
		prisma.wallet.findMany({
			where: {
				organizationId: { not: null },
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
						autoPayout: true,
						paystackBankCode: true,
						paystackAccountNumber: true,
						paystackAccountName: true,
					},
				},
			},
			orderBy: { balance: "desc" },
		}),
		prisma.payout.findMany({
			take: 20,
			orderBy: { createdAt: "desc" },
			include: {
				approver: {
					select: {
						fullName: true,
						email: true,
					},
				},
				wallet: {
					select: {
						organization: {
							select: {
								name: true,
								slug: true,
							},
						},
					},
				},
			},
		}),
	]);

	let totalActiveGHS = 0;
	let totalLockedGHS = 0;
	let pendingDebitsGHS = 0;
	let pendingCreditsGHS = 0;

	const wallets: AdminWalletItem[] = walletsData.map((w) => {
		const bal = Number(w.balance || 0);
		const pCredits = Number(w.pendingCredits || 0);
		const pDebits = Number(w.pendingDebits || 0);

		if (w.isLocked) {
			totalLockedGHS += bal;
		} else {
			totalActiveGHS += bal;
		}
		pendingCreditsGHS += pCredits;
		pendingDebitsGHS += pDebits;

		return {
			id: w.id,
			organizationId: w.organizationId || "",
			organizationName: w.organization?.name || "Unknown Organization",
			organizationSlug: w.organization?.slug || "",
			organizationLogo: w.organization?.logoUrl || null,
			balance: bal,
			currency: w.currency,
			pendingCredits: pCredits,
			pendingDebits: pDebits,
			isActive: w.isActive,
			isLocked: w.isLocked,
			lockReason: w.lockReason,
			lastTransactionAt: w.lastTransactionAt
				? w.lastTransactionAt.toISOString()
				: null,
			createdAt: w.createdAt.toISOString(),
			autoPayout: Boolean(w.organization?.autoPayout),
			bankName: w.organization?.paystackBankCode || null,
			accountNumber: w.organization?.paystackAccountNumber || null,
			accountName: w.organization?.paystackAccountName || null,
		};
	});

	const recentPayouts: AdminPayoutItem[] = payoutsData.map((p) => ({
		id: p.id,
		reference: p.reference,
		amount: Number(p.amount || 0),
		currency: p.currency,
		feeAmount: Number(p.feeAmount || 0),
		status: p.status,
		recipientName: p.recipientName,
		bankName: p.bankName,
		accountNumber: p.accountNumber,
		accountName: p.accountName,
		createdAt: p.createdAt.toISOString(),
		approvedAt: p.approvedAt ? p.approvedAt.toISOString() : null,
		processedAt: p.processedAt ? p.processedAt.toISOString() : null,
		completedAt: p.completedAt ? p.completedAt.toISOString() : null,
		approver: p.approver,
		wallet: p.wallet,
	}));

	return {
		wallets,
		recentPayouts,
		floatSummary: {
			totalActiveGHS,
			totalLockedGHS,
			pendingDebitsGHS,
			pendingCreditsGHS,
		},
	};
}
