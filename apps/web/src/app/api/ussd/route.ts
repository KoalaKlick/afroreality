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

function normalizeArkeselInput(userData: string, newSession: boolean): string {
	const cleaned = userData.replace(/[#\uFF03]+$/, "");
	if (newSession) {
		const baseCodes = ["*384*77340", "*920*55", "*920", "*384", "*713", "*714"];
		for (const base of baseCodes) {
			if (cleaned.startsWith(base)) {
				const extra = cleaned.substring(base.length);
				return extra.startsWith("*") ? extra.substring(1) : extra;
			}
		}
		const match = cleaned.match(/^\*\d+(?:\*\d+)*\*(\d+(?:\*.*)?)$/);
		if (match && match[1]) {
			return match[1];
		}
		if (cleaned.startsWith("*")) {
			const parts = cleaned.split("*").filter(Boolean);
			if (parts.length > 0) return parts[parts.length - 1] || "";
		}
	}
	return cleaned;
}

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

// ─── Payment Initiation Helper ───────────────────────────────────────────────

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
				amount: totalAmountGHS,
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
				amount: totalAmountGHS,
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

	const nominees = (selectedCategory.votingOptions || [])
		.filter((n: any) => n.status === "approved" || !n.status)
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
			(tkt, idx) => `${idx}. ${tkt.name} - GHS ${Number(tkt.price).toFixed(2)}\n`,
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

// ─── Core USSD Router ─────────────────────────────────────────────────────────

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

	let tokens = [...inputArray];
	let event: any = null;

	if (tokens[0] === ENTER_CODE_OPTION) {
		tokens.shift();
		if (tokens.length === 0) {
			return "CON Enter event code:\n0. Back";
		}
		const eventCode = tokens.shift();
		event = await prisma.event.findFirst({
			where: { ussdCode: eventCode, hasUssd: true },
			include: {
				votingCategories: {
					include: { votingOptions: true },
				},
				ticketTypes: true,
			},
		});
	} else {
		const firstInput = tokens[0] || "";
		// Direct lookup by event ussdCode (e.g. *384*77340*689#)
		event = await prisma.event.findFirst({
			where: { ussdCode: firstInput, hasUssd: true },
			include: {
				votingCategories: {
					include: { votingOptions: true },
				},
				ticketTypes: true,
			},
		});

		if (event) {
			tokens.shift();
		} else {
			// Listed menu index lookup
			const selectedIdx = Number.parseInt(firstInput, 10);
			const listedEvents = await prisma.event.findMany({
				where: { hasUssd: true },
				include: {
					votingCategories: {
						include: { votingOptions: true },
					},
					ticketTypes: true,
				},
				orderBy: { createdAt: "desc" },
				take: MAX_LISTED_EVENTS,
			});

			if (listedEvents && selectedIdx >= 1 && selectedIdx <= listedEvents.length) {
				event = listedEvents[selectedIdx - 1];
				tokens.shift();
			}
		}
	}

	if (!event) {
		return "END Event not found. Check your code.";
	}

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

// ─── Entrypoints (POST & GET) ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
	try {
		const contentType = req.headers.get("content-type") || "";
		let bodyData: any = {};
		let phoneNumber = "";
		let rawText = "";
		let sessionId = "";
		let userId = "";
		let isNewSession = false;

		if (contentType.includes("application/json")) {
			bodyData = await req.json();
			phoneNumber = bodyData.phoneNumber || bodyData.msisdn || "";
			rawText =
				bodyData.text !== undefined
					? bodyData.text
					: bodyData.userData || bodyData.message || "";
			sessionId = bodyData.sessionId || bodyData.sessionID || "";
			userId = bodyData.userId || bodyData.userID || "";
			const typeStr = (bodyData.type || "").toLowerCase();
			isNewSession = bodyData.newSession === true || typeStr === "initiation";
		} else {
			const bodyText = await req.text();
			const params = new URLSearchParams(bodyText);
			bodyData = Object.fromEntries(params.entries());
			phoneNumber =
				params.get("phoneNumber") || params.get("msisdn") || "";
			rawText =
				params.get("text") ||
				params.get("userData") ||
				params.get("ussdString") ||
				"";
			sessionId =
				params.get("sessionId") || params.get("sessionID") || "";
			userId = params.get("userId") || params.get("userID") || "";
			const typeStr = (params.get("type") || "").toLowerCase();
			isNewSession =
				params.get("newSession") === "true" || typeStr === "initiation";
		}

		const isArkesel =
			req.nextUrl.searchParams.get("provider") === "arkesel" ||
			bodyData.sessionID !== undefined ||
			bodyData.msisdn !== undefined ||
			bodyData.userData !== undefined;

		if (isArkesel) {
			const currentInput = normalizeArkeselInput(rawText, isNewSession);
			let accumulatedPath = currentInput;

			if (sessionId) {
				if (!isNewSession) {
					const state = await prisma.ussdState.findUnique({
						where: { sessionId },
					});
					if (state && state.accumulatedPath) {
						accumulatedPath = `${state.accumulatedPath}*${currentInput}`;
					}
				}

				await prisma.ussdState.upsert({
					where: { sessionId },
					create: { sessionId, accumulatedPath },
					update: { accumulatedPath },
				});
			}

			const coreResult = await handleUssdCore(phoneNumber, accumulatedPath);
			return toArkeselResponse(coreResult, sessionId, userId, phoneNumber);
		}

		// Africa's Talking / Plain Text Standard
		const coreResult = await handleUssdCore(phoneNumber, rawText);
		return textResponse(coreResult);
	} catch (error) {
		console.error("[USSD Webhook Error]:", error);
		return textResponse("END Something went wrong. Please try again later.");
	}
}

export async function GET(req: NextRequest) {
	const phoneNumber =
		req.nextUrl.searchParams.get("phoneNumber") ||
		req.nextUrl.searchParams.get("msisdn") ||
		"";
	const rawText =
		req.nextUrl.searchParams.get("text") ||
		req.nextUrl.searchParams.get("userData") ||
		"";
	const sessionId =
		req.nextUrl.searchParams.get("sessionId") ||
		req.nextUrl.searchParams.get("sessionID") ||
		"";
	const userId =
		req.nextUrl.searchParams.get("userId") ||
		req.nextUrl.searchParams.get("userID") ||
		"";
	const isNewSession =
		req.nextUrl.searchParams.get("newSession") === "true";

	const isArkesel =
		req.nextUrl.searchParams.get("provider") === "arkesel" ||
		Boolean(sessionId && userId);

	if (isArkesel) {
		const currentInput = normalizeArkeselInput(rawText, isNewSession);
		let accumulatedPath = currentInput;

		if (sessionId) {
			if (!isNewSession) {
				const state = await prisma.ussdState.findUnique({
					where: { sessionId },
				});
				if (state && state.accumulatedPath) {
					accumulatedPath = `${state.accumulatedPath}*${currentInput}`;
				}
			}

			await prisma.ussdState.upsert({
				where: { sessionId },
				create: { sessionId, accumulatedPath },
				update: { accumulatedPath },
			});
		}

		const coreResult = await handleUssdCore(phoneNumber, accumulatedPath);
		return toArkeselResponse(coreResult, sessionId, userId, phoneNumber);
	}

	const coreResult = await handleUssdCore(phoneNumber, rawText);
	return textResponse(coreResult);
}
