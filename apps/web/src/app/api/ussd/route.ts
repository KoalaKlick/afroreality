import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { computeChargeAmount, toPesewas } from "@repo/pricing";

export const dynamic = "force-dynamic";

const MAX_LISTED_EVENTS = 7;
const ENTER_CODE_OPTION = "0";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function textResponse(text: string) {
	return new NextResponse(text, {
		status: 200,
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

function jsonResponse(body: object) {
	return NextResponse.json(body, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
	});
}

function toArkeselResponse(
	rawText: string,
	sessionID: string,
	userID: string,
	msisdn: string,
) {
	const continueSession = rawText.startsWith("CON");
	const message = rawText.replace(/^(CON|END)\s*/, "");

	return jsonResponse({
		sessionID,
		userID,
		msisdn,
		message,
		continueSession,
	});
}

function normalizePhone(phone: string): string {
	let local = phone.replace(/^\+?233/, "0");
	if (local.startsWith("00")) local = local.substring(1);
	return local;
}

function getProvider(phone: string): "mtn" | "vod" | "tgo" {
	const local = normalizePhone(phone);
	const prefix = local.substring(0, 3);
	if (["024", "054", "055", "059", "025", "053"].includes(prefix)) return "mtn";
	if (["020", "050"].includes(prefix)) return "vod";
	if (["027", "057", "026", "056"].includes(prefix)) return "tgo";
	return "mtn";
}

/**
 * Arkesel sends the full USSD string on newSession (e.g. "*384*77340*689#").
 * We strip the base code so handleUssdCore sees just "689" (like AT would).
 * On subsequent turns, Arkesel sends only the current input (e.g. "1").
 *
 * Mirrors: current-live-next-project/supabase/functions/ussd-arkesel/index.ts
 */
function normalizeArkeselInput(userData: string, newSession: boolean): string {
	// Arkesel sometimes sends Fullwidth Number Sign (＃) instead of standard #
	const cleaned = userData.replace(/[#＃]+$/, "");

	if (newSession) {
		const baseCodes = ["*384*77340", "*920*55", "*920", "*384", "*713", "*714"];
		for (const base of baseCodes) {
			if (cleaned.startsWith(base)) {
				const extra = cleaned.substring(base.length);
				// *384*77340*689# → extra = "*689" → return "689"
				// *384*77340# → extra = "" → return ""
				if (extra.startsWith("*")) {
					return extra.substring(1);
				}
				return extra;
			}
		}
	}
	return cleaned;
}

// ─── Token Navigation ───────────────────────────────────────────────────────
// Mirrors: current-live-next-project/supabase/functions/_shared/ussd-handler.ts

function reduceTokens(tokens: string[]): string[] {
	const stack: string[] = [];
	for (const token of tokens) {
		if (token === "0") {
			if (stack.length === 0) {
				stack.push("0");
			} else if (stack.length === 1 && stack[0] === "0") {
				stack.pop();
			} else {
				stack.pop();
			}
		} else {
			stack.push(token);
		}
	}
	return stack;
}

function getPaginatedSelection(tokens: string[]): {
	page: number;
	selectedIndex: number | null;
	remainingTokens: string[];
} {
	let page = 1;
	const PAGE_SIZE = 7;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === "99") {
			page++;
		} else if (token === "98") {
			page = Math.max(1, page - 1);
		} else {
			const idx = Number.parseInt(token || "", 10);
			if (Number.isNaN(idx))
				return { page, selectedIndex: null, remainingTokens: tokens.slice(i) };
			const absoluteIndex = (page - 1) * PAGE_SIZE + (idx - 1);
			return {
				page,
				selectedIndex: absoluteIndex,
				remainingTokens: tokens.slice(i + 1),
			};
		}
	}
	return { page, selectedIndex: null, remainingTokens: [] };
}

function buildPaginatedMenu(
	title: string,
	items: any[],
	page: number,
	renderItem: (item: any, localIdx: number) => string,
): string {
	const PAGE_SIZE = 7;
	const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
	const currentPage = Math.max(1, Math.min(page, totalPages));

	const startIndex = (currentPage - 1) * PAGE_SIZE;
	const pageItems = items.slice(startIndex, startIndex + PAGE_SIZE);

	let menu = `CON ${title}\n`;
	pageItems.forEach((item, i) => {
		menu += renderItem(item, i + 1);
	});

	if (currentPage < totalPages) menu += "99. More\n";
	if (currentPage > 1) menu += "98. Prev\n";
	menu += "0. Back\n";
	return menu;
}

// ─── Prisma Event Select ────────────────────────────────────────────────────
// Mirrors: _shared/ussd-handler.ts EVENT_SELECT
// We fetch votingOptions at event level (like the Supabase query) so we can
// filter by category_id in handleVotingFlow.

const EVENT_INCLUDE = {
	votingCategories: true,
	votingOptions: true,
	ticketTypes: true,
} as const;

async function fetchEventByCode(code: string) {
	return prisma.event.findFirst({
		where: { ussdCode: code, hasUssd: true },
		include: EVENT_INCLUDE,
	});
}

// ─── Payment Initiation Helper ───────────────────────────────────────────────
// Mirrors: _shared/ussd-handler.ts processPayment

async function processPayment(
	event: any,
	optionId: string,
	quantity: number,
	price: number,
	phoneNumber: string,
	otpStr?: string,
): Promise<string> {
	if (Number.isNaN(quantity) || quantity <= 0) {
		return "END Invalid number. Try again.";
	}

	const baseAmount = Number(price) * quantity;
	const feeCalc = computeChargeAmount(baseAmount, event.type === "voting" ? "vote" : "ticket");
	const totalAmountGHS = feeCalc.totalToCharge;
	const amountPesewas = toPesewas(totalAmountGHS);
	const paystackSecret = process.env.PAYSTACK_SECRET_KEY || "";
	const provider = getProvider(phoneNumber);
	const reference = `USSD_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

	try {
		await prisma.ussdSession.create({
			data: {
				reference,
				phoneNumber,
				eventId: event.id,
				optionId,
				quantity,
				amount: baseAmount,
				status: "pending",
			},
		});

		await prisma.payment.upsert({
			where: { reference },
			update: {},
			create: {
				reference,
				email: `${normalizePhone(phoneNumber)}@afroreality.com`,
				purpose: event.type === "voting" ? "vote_purchase" : "ticket_purchase",
				amount: baseAmount,
				currency: "GHS",
				provider: "paystack",
				status: "pending",
				metadata: {
					source: "ussd",
					channel: "ussd",
					eventId: event.id,
					optionId,
					votingOptionId: optionId,
					ticketTypeId: optionId,
					quantity,
					voteCount: quantity,
					phoneNumber,
					baseAmount,
					platformFee: feeCalc.platformFee,
					organizerReceives: feeCalc.organizerReceives,
					paystackFee: feeCalc.paystackFee,
					totalToCharge: totalAmountGHS,
				},
			},
		});

		if (!paystackSecret) {
			return `END Payment of GHS ${totalAmountGHS.toFixed(2)} recorded. Reference: ${reference}`;
		}

		const paystackRes = await fetch("https://api.paystack.co/charge", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${paystackSecret}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount: amountPesewas,
				email: `${normalizePhone(phoneNumber)}@afroreality.com`,
				currency: "GHS",
				reference,
				mobile_money: {
					phone: normalizePhone(phoneNumber),
					provider,
				},
				metadata: {
					source: "ussd",
					channel: "ussd",
					eventId: event.id,
					optionId,
					votingOptionId: optionId,
					ticketTypeId: optionId,
					quantity,
					voteCount: quantity,
					phoneNumber,
					baseAmount,
					platformFee: feeCalc.platformFee,
					organizerReceives: feeCalc.organizerReceives,
					paystackFee: feeCalc.paystackFee,
					totalToCharge: totalAmountGHS,
				},
			}),
		});

		const paystackData = (await paystackRes.json()) as any;

		if (!paystackRes.ok || !paystackData.status) {
			console.error("Paystack Charge Error:", paystackData);
			return `END Payment initiation failed: ${paystackData.message || "Unknown error"}`;
		}

		if (paystackData.data?.status === "send_otp") {
			return `CON ${paystackData.data.display_text || "Please enter the OTP sent to your phone"}:\n0. Back`;
		}
	} catch (err) {
		console.error("Paystack Charge Exception:", err);
		return "END Payment initiation failed. Try again later.";
	}

	return "END Request received. Please check your phone for the prompt to enter your MoMo PIN.";
}

// ─── Flow Handlers ───────────────────────────────────────────────────────────
// Mirrors: _shared/ussd-handler.ts handleVotingFlow / handleTicketFlow
// Key: nominees come from event.votingOptions filtered by category_id

async function handleVotingFlow(
	event: any,
	tokens: string[],
	phoneNumber: string,
): Promise<string> {
	const categories = (event.votingCategories || []).sort(
		(a: any, b: any) => (a.orderIdx ?? 0) - (b.orderIdx ?? 0),
	);
	if (categories.length === 0) return "END No voting categories available.";

	const catSelection = getPaginatedSelection(tokens);
	if (catSelection.selectedIndex === null) {
		return buildPaginatedMenu(
			`${event.title}\nSelect Category:`,
			categories,
			catSelection.page,
			(cat, idx) => `${idx}. ${cat.name}\n`,
		);
	}

	const selectedCategory = categories[catSelection.selectedIndex];
	if (!selectedCategory) return "END Invalid category.";

	tokens = catSelection.remainingTokens;

	// Filter nominees from event-level votingOptions by category_id
	// (mirrors reference: event.voting_options filtered by n.category_id === selectedCategory.id)
	const nominees = (event.votingOptions || [])
		.filter(
			(n: any) =>
				n.categoryId === selectedCategory.id &&
				(n.status === "approved" || !n.status),
		)
		.sort((a: any, b: any) => (a.orderIdx ?? 0) - (b.orderIdx ?? 0));

	if (nominees.length === 0) return `END No nominees in ${selectedCategory.name}.`;

	const nomSelection = getPaginatedSelection(tokens);
	if (nomSelection.selectedIndex === null) {
		return buildPaginatedMenu(
			selectedCategory.name,
			nominees,
			nomSelection.page,
			(nom, idx) => `${idx}. ${nom.optionText}\n`,
		);
	}

	const selectedNominee = nominees[nomSelection.selectedIndex];
	if (!selectedNominee) return "END Invalid nominee.";

	tokens = nomSelection.remainingTokens;

	const quantityStr = tokens.shift();
	if (!quantityStr) {
		return `CON How many votes for ${selectedNominee.optionText}?\n0. Back`;
	}

	const otpStr = tokens.shift();
	const votePrice = Number(selectedCategory.votePrice) || 0.5;

	return await processPayment(
		event,
		selectedNominee.id,
		Number.parseInt(quantityStr, 10),
		votePrice,
		phoneNumber,
		otpStr,
	);
}

async function handleTicketFlow(
	event: any,
	tokens: string[],
	phoneNumber: string,
): Promise<string> {
	const tickets = (event.ticketTypes || [])
		.filter((t: any) => t.status === "available")
		.sort((a: any, b: any) => (a.orderIdx ?? 0) - (b.orderIdx ?? 0));

	if (tickets.length === 0) return "END No tickets available.";

	const tktSelection = getPaginatedSelection(tokens);
	if (tktSelection.selectedIndex === null) {
		return buildPaginatedMenu(
			`${event.title}\nSelect Ticket:`,
			tickets,
			tktSelection.page,
			(tkt, idx) => `${idx}. ${tkt.name} - GHS ${tkt.price}\n`,
		);
	}

	const selectedTicket = tickets[tktSelection.selectedIndex];
	if (!selectedTicket) return "END Invalid ticket.";

	tokens = tktSelection.remainingTokens;

	const quantityStr = tokens.shift();
	if (!quantityStr) {
		return `CON How many ${selectedTicket.name} tickets?\n0. Back`;
	}

	const otpStr = tokens.shift();
	const ticketPrice = Number(selectedTicket.price) || 0;

	return await processPayment(
		event,
		selectedTicket.id,
		Number.parseInt(quantityStr, 10),
		ticketPrice,
		phoneNumber,
		otpStr,
	);
}

// ─── Core USSD Router (provider-agnostic) ────────────────────────────────────
// Both AT and Arkesel entrypoints call this after parsing their payloads.
// Mirrors: _shared/ussd-handler.ts handleUssdRequest

async function handleUssdCore(phoneNumber: string, text: string): Promise<string> {
	// 1. Pending session / OTP resumption check (within last 5 mins)
	const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
	const pendingSession = await prisma.ussdSession.findFirst({
		where: {
			phoneNumber,
			status: "pending",
			createdAt: { gte: fiveMinsAgo },
		},
		orderBy: { createdAt: "desc" },
	});

	if (pendingSession) {
		const rawTokens = text.split("*").filter(Boolean);
		if (rawTokens.length === 0) {
			return `CON You have a pending payment of GHS ${Number(pendingSession.amount).toFixed(2)}.\nEnter the OTP sent via SMS to confirm:\n0. Cancel`;
		}
		const otpAnswer = rawTokens[rawTokens.length - 1];
		if (otpAnswer === "0") {
			await prisma.ussdSession.update({
				where: { id: pendingSession.id },
				data: { status: "cancelled" },
			});
			text = "";
		}
	}

	const rawInputArray = text.split("*").filter(Boolean);
	const inputArray = reduceTokens(rawInputArray);
	const depth = inputArray.length;

	console.log("[USSD Core]", { text, rawInputArray, inputArray, depth });

	// 2. Welcome screen (Depth 0)
	if (depth === 0) {
		const events = await prisma.event.findMany({
			where: { hasUssd: true },
			select: { id: true, title: true, ussdCode: true },
			orderBy: { createdAt: "desc" },
			take: MAX_LISTED_EVENTS,
		});

		let menu = "CON Welcome to AfroReality\n";
		if (events.length > 0) {
			events.forEach((ev, idx) => {
				menu += `${idx + 1}. ${ev.title}\n`;
			});
			menu += `${ENTER_CODE_OPTION}. Enter code\n`;
		} else {
			menu += "Enter event code:\n";
		}
		return menu;
	}

	// 3. Resolve event
	// Mirrors reference: _shared/ussd-handler.ts lines 353-382
	let tokens = [...inputArray];
	let event: any = null;

	if (tokens[0] === ENTER_CODE_OPTION) {
		// User chose "0. Enter code" from the welcome screen
		tokens.shift();
		if (tokens.length === 0) {
			return "CON Enter event code:\n0. Back";
		}
		const eventCode = tokens.shift()!;
		event = await fetchEventByCode(eventCode);
	} else {
		const firstInput = tokens[0] || "";
		const selectedIdx = Number.parseInt(firstInput, 10);

		// Try listed-index first (user picked from the welcome menu)
		const listedEvents = await prisma.event.findMany({
			where: { hasUssd: true },
			include: EVENT_INCLUDE,
			orderBy: { createdAt: "desc" },
			take: MAX_LISTED_EVENTS,
		});

		if (listedEvents && selectedIdx >= 1 && selectedIdx <= listedEvents.length) {
			// Matched a listed event by its menu index
			event = listedEvents[selectedIdx - 1];
			tokens.shift();
		} else {
			// Fallback: treat firstInput as a ussdCode (deep-link like *384*77340*689#)
			event = await fetchEventByCode(firstInput);
			tokens.shift();
		}
	}

	console.log("[USSD Core] Event resolved:", {
		eventId: event?.id,
		eventTitle: event?.title,
		eventType: event?.type,
		remainingTokens: tokens,
	});

	if (!event) {
		return "END Event not found. Check your code.";
	}

	// 4. Route by event type
	const eventType = event.type;

	if (eventType === "voting") {
		return await handleVotingFlow(event, tokens, phoneNumber);
	}

	if (eventType === "ticketed") {
		return await handleTicketFlow(event, tokens, phoneNumber);
	}

	if (eventType === "standard" || eventType === "hybrid") {
		const modeStr = tokens.shift();
		if (!modeStr) {
			return `CON ${event.title}\n1. Voting\n2. Tickets\n0. Back`;
		}
		if (modeStr === "1") {
			return await handleVotingFlow(event, tokens, phoneNumber);
		}
		if (modeStr === "2") {
			return await handleTicketFlow(event, tokens, phoneNumber);
		}
		return "END Invalid selection.";
	}

	return "END Unsupported event type.";
}

// ─── Entrypoints ─────────────────────────────────────────────────────────────
// Mirrors the reference project's two separate endpoints:
//   ussd/index.ts          → Africa's Talking (form-encoded, text is accumulated)
//   ussd-arkesel/index.ts  → Arkesel (JSON, session accumulation via DB)

export async function POST(req: NextRequest) {
	try {
		const contentType = req.headers.get("content-type") || "";
		const providerParam = req.nextUrl.searchParams.get("provider") || "";

		// ─── Arkesel Path (JSON) ─────────────────────────────────────────
		// Mirrors: ussd-arkesel/index.ts serve() handler
		if (providerParam === "arkesel" || contentType.includes("application/json")) {
			const body = await req.json();

			const sessionID = body.sessionID || body.sessionId || "";
			const userID = body.userID || body.userId || "";
			const msisdn = body.msisdn || body.phoneNumber || "";

			const typeStr = (body.type || "").toLowerCase();
			const newSession = body.newSession === true || typeStr === "initiation";

			// Mirrors reference line 75: body.userData || body.text
			let userData = body.userData || body.text;
			if (userData === undefined) userData = "";

			console.log("[USSD POST Arkesel]", {
				sessionID,
				msisdn,
				userData,
				newSession,
				typeStr,
				bodyKeys: Object.keys(body),
			});

			const currentInput = normalizeArkeselInput(String(userData), newSession);

			let accumulatedPath = currentInput;

			// Mirrors reference lines 100-110: accumulate path across turns
			if (!newSession && sessionID) {
				const state = await prisma.ussdState.findUnique({
					where: { sessionId: sessionID },
				});
				if (state && state.accumulatedPath) {
					accumulatedPath = state.accumulatedPath + "*" + currentInput;
				}
			}

			// Save the new accumulated state
			if (sessionID) {
				await prisma.ussdState.upsert({
					where: { sessionId: sessionID },
					create: { sessionId: sessionID, accumulatedPath },
					update: { accumulatedPath },
				});
			}

			console.log("[USSD Arkesel]", {
				currentInput,
				accumulatedPath,
				newSession,
			});

			// Process using the shared handler with the accumulated path
			const coreResult = await handleUssdCore(msisdn, accumulatedPath);
			return toArkeselResponse(coreResult, sessionID, userID, msisdn);
		}

		// ─── Africa's Talking Path (form-encoded) ────────────────────────
		// Mirrors: ussd/index.ts serve() handler
		// AT sends: application/x-www-form-urlencoded
		// Fields: sessionId, serviceCode, phoneNumber, text
		// text is already accumulated across turns by AT
		const bodyText = await req.text();
		const params = new URLSearchParams(bodyText);
		const phoneNumber = params.get("phoneNumber") || "";
		const text = params.get("text") || "";

		console.log("[USSD POST AT]", { phoneNumber, text });

		const coreResult = await handleUssdCore(phoneNumber, text);
		return textResponse(coreResult);
	} catch (error) {
		console.error("[USSD Webhook Error]:", error);
		return textResponse("END Something went wrong. Please try again later.");
	}
}

export async function GET(req: NextRequest) {
	try {
		const providerParam = req.nextUrl.searchParams.get("provider") || "";

		if (providerParam === "arkesel") {
			const sessionID = req.nextUrl.searchParams.get("sessionID") || req.nextUrl.searchParams.get("sessionId") || "";
			const userID = req.nextUrl.searchParams.get("userID") || req.nextUrl.searchParams.get("userId") || "";
			const msisdn = req.nextUrl.searchParams.get("msisdn") || req.nextUrl.searchParams.get("phoneNumber") || "";
			const userData = req.nextUrl.searchParams.get("userData") || req.nextUrl.searchParams.get("text") || "";
			const isNewSession = req.nextUrl.searchParams.get("newSession") === "true";

			const currentInput = normalizeArkeselInput(userData, isNewSession);
			let accumulatedPath = currentInput;

			if (!isNewSession && sessionID) {
				const state = await prisma.ussdState.findUnique({
					where: { sessionId: sessionID },
				});
				if (state && state.accumulatedPath) {
					accumulatedPath = state.accumulatedPath + "*" + currentInput;
				}
			}

			if (sessionID) {
				await prisma.ussdState.upsert({
					where: { sessionId: sessionID },
					create: { sessionId: sessionID, accumulatedPath },
					update: { accumulatedPath },
				});
			}

			const coreResult = await handleUssdCore(msisdn, accumulatedPath);
			return toArkeselResponse(coreResult, sessionID, userID, msisdn);
		}

		// AT via GET (unlikely but supported)
		const phoneNumber = req.nextUrl.searchParams.get("phoneNumber") || "";
		const text = req.nextUrl.searchParams.get("text") || "";

		const coreResult = await handleUssdCore(phoneNumber, text);
		return textResponse(coreResult);
	} catch (error) {
		console.error("[USSD GET Error]:", error);
		return textResponse("END Something went wrong. Please try again later.");
	}
}
