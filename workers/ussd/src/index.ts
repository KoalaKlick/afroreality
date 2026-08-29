import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface Env {
	SUPABASE_URL?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
	PAYSTACK_SECRET_KEY?: string;
	MAX_LISTED_EVENTS?: string;
}

export const MAX_LISTED_EVENTS = 7;
export const ENTER_CODE_OPTION = "0";

// Provider Detection & Helpers
export function normalizePhone(phone: string): string {
	let localPhone = phone.replace(/^\+?233/, "0");
	if (localPhone.startsWith("00")) localPhone = localPhone.substring(1);
	return localPhone;
}

export function getProvider(phone: string): string {
	const localPhone = normalizePhone(phone);
	const prefix = localPhone.substring(0, 3);
	if (["024", "054", "055", "059", "025", "053"].includes(prefix))
		return "mtn";
	if (["020", "050"].includes(prefix)) return "vod";
	if (["027", "057", "026", "056"].includes(prefix)) return "tgo";
	return "mtn";
}

export function textResponse(body: string): Response {
	return new Response(body, {
		status: 200,
		headers: {
			"Content-Type": "text/plain",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

export function jsonResponse(body: object): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

// Token Navigation & Menus
export function reduceTokens(tokens: string[]): string[] {
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

export function getPaginatedSelection(tokens: string[]): {
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
			const idx = Number.parseInt(token, 10);
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

export function buildPaginatedMenu(
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

// Database Queries
export const EVENT_SELECT = `
  id, title, has_ussd, ussd_code, type,
  voting_categories (id, name, order_idx, vote_price),
  voting_options (id, option_text, order_idx, status, category_id),
  ticket_types (id, name, price, status, order_idx)
`;

export async function fetchEventByCode(supabase: SupabaseClient, code: string) {
	const { data } = await supabase
		.from("events")
		.select(EVENT_SELECT)
		.eq("ussd_code", code)
		.eq("has_ussd", true)
		.single();
	return data;
}

// Payment Processing via Paystack
export async function submitOtp(
	supabase: SupabaseClient,
	reference: string,
	otp: string,
	paystackSecret: string,
): Promise<Response> {
	try {
		const paystackRes = await fetch(
			"https://api.paystack.co/charge/submit_otp",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${paystackSecret}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ otp, reference }),
			},
		);
		const paystackData = (await paystackRes.json()) as any;

		if (!paystackRes.ok || !paystackData.status) {
			await supabase
				.from("ussd_sessions")
				.update({ status: "pending" })
				.eq("reference", reference);
			return textResponse(
				`END OTP verification failed: ${paystackData.message || "Invalid OTP"}`,
			);
		}

		await supabase
			.from("ussd_sessions")
			.update({ status: "processing" })
			.eq("reference", reference);
		return textResponse(
			"END Payment authorized! You will receive an SMS confirmation shortly.",
		);
	} catch (err) {
		console.error("Paystack OTP Exception:", err);
		return textResponse("END OTP submission failed. Try again later.");
	}
}

export async function processPayment(
	supabase: SupabaseClient,
	event: any,
	optionId: string,
	quantity: number,
	price: number,
	phoneNumber: string,
	paystackSecret: string,
	otpStr?: string,
): Promise<Response> {
	if (Number.isNaN(quantity) || quantity <= 0) {
		return textResponse("END Invalid number. Try again.");
	}

	const amountGHS = Number(price) * quantity;

	if (otpStr) {
		const { data: session } = await supabase
			.from("ussd_sessions")
			.select("reference")
			.eq("phone_number", phoneNumber)
			.eq("status", "pending")
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (session) {
			return await submitOtp(
				supabase,
				session.reference,
				otpStr,
				paystackSecret,
			);
		}
	}

	const provider = getProvider(phoneNumber);
	const reference = `USSD_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

	try {
		await supabase.from("ussd_sessions").insert({
			phone_number: phoneNumber,
			event_id: event.id,
			option_id: optionId,
			quantity,
			amount: amountGHS,
			reference,
			status: "pending",
		});

		if (!paystackSecret) {
			return textResponse(
				`END Payment of GHS ${amountGHS.toFixed(2)} recorded. Reference: ${reference}`,
			);
		}

		const paystackRes = await fetch("https://api.paystack.co/charge", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${paystackSecret}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount: Math.round(amountGHS * 100),
				email: `${normalizePhone(phoneNumber)}@afrotix.com`,
				currency: "GHS",
				reference,
				mobile_money: {
					phone: normalizePhone(phoneNumber),
					provider,
				},
				metadata: {
					source: "ussd",
					event_id: event.id,
					option_id: optionId,
					quantity,
					phone_number: phoneNumber,
				},
			}),
		});

		const paystackData = (await paystackRes.json()) as any;

		if (!paystackRes.ok || !paystackData.status) {
			console.error("Paystack Charge Error:", paystackData);
			return textResponse(
				`END Payment failed: ${paystackData.message || "Please check your network and balance."}`,
			);
		}

		if (paystackData.data?.status === "send_otp") {
			return textResponse(
				`CON ${paystackData.data.display_text || "Please enter the OTP sent to your phone"}:\n0. Back`,
			);
		}
	} catch (err) {
		console.error("Paystack Charge Exception:", err);
		return textResponse("END Payment initiation failed. Try again later.");
	}

	return textResponse(
		"END Request received. Please check your phone for the prompt to enter your MoMo PIN.",
	);
}

// Flow Handlers
export async function handleVotingFlow(
	supabase: SupabaseClient,
	event: any,
	tokens: string[],
	phoneNumber: string,
	paystackSecret: string,
): Promise<Response> {
	const categories = (event.voting_categories ?? []).sort(
		(a: any, b: any) => a.order_idx - b.order_idx,
	);
	if (categories.length === 0)
		return textResponse("END No voting categories available.");

	const catSelection = getPaginatedSelection(tokens);
	if (catSelection.selectedIndex === null) {
		return textResponse(
			buildPaginatedMenu(
				`${event.title}\nSelect Category:`,
				categories,
				catSelection.page,
				(cat, idx) => `${idx}. ${cat.name}\n`,
			),
		);
	}

	const selectedCategory = categories[catSelection.selectedIndex];
	if (!selectedCategory) return textResponse("END Invalid category.");

	tokens = catSelection.remainingTokens;

	const nominees = (event.voting_options ?? [])
		.filter(
			(n: any) =>
				n.status === "approved" && n.category_id === selectedCategory.id,
		)
		.sort((a: any, b: any) => a.order_idx - b.order_idx);

	if (nominees.length === 0)
		return textResponse("END No nominees in this category.");

	const nomSelection = getPaginatedSelection(tokens);
	if (nomSelection.selectedIndex === null) {
		return textResponse(
			buildPaginatedMenu(
				selectedCategory.name,
				nominees,
				nomSelection.page,
				(nom, idx) => `${idx}. ${nom.option_text}\n`,
			),
		);
	}

	const selectedNominee = nominees[nomSelection.selectedIndex];
	if (!selectedNominee) return textResponse("END Invalid nominee.");

	tokens = nomSelection.remainingTokens;

	const quantityStr = tokens.shift();
	if (!quantityStr) {
		return textResponse(
			`CON How many votes for ${selectedNominee.option_text}?\n0. Back`,
		);
	}

	const otpStr = tokens.shift();

	return await processPayment(
		supabase,
		event,
		selectedNominee.id,
		Number.parseInt(quantityStr, 10),
		selectedCategory.vote_price,
		phoneNumber,
		paystackSecret,
		otpStr,
	);
}

export async function handleTicketFlow(
	supabase: SupabaseClient,
	event: any,
	tokens: string[],
	phoneNumber: string,
	paystackSecret: string,
): Promise<Response> {
	const tickets = (event.ticket_types ?? [])
		.filter((t: any) => t.status === "available")
		.sort((a: any, b: any) => a.order_idx - b.order_idx);

	if (tickets.length === 0)
		return textResponse("END No tickets available.");

	const tktSelection = getPaginatedSelection(tokens);
	if (tktSelection.selectedIndex === null) {
		return textResponse(
			buildPaginatedMenu(
				`${event.title}\nSelect Ticket:`,
				tickets,
				tktSelection.page,
				(tkt, idx) => `${idx}. ${tkt.name} - GHS ${tkt.price}\n`,
			),
		);
	}

	const selectedTicket = tickets[tktSelection.selectedIndex];
	if (!selectedTicket) return textResponse("END Invalid ticket.");

	tokens = tktSelection.remainingTokens;

	const quantityStr = tokens.shift();
	if (!quantityStr) {
		return textResponse(
			`CON How many ${selectedTicket.name} tickets?\n0. Back`,
		);
	}

	const otpStr = tokens.shift();

	return await processPayment(
		supabase,
		event,
		selectedTicket.id,
		Number.parseInt(quantityStr, 10),
		selectedTicket.price,
		phoneNumber,
		paystackSecret,
		otpStr,
	);
}

// Unified Core USSD Request Handler
export async function handleUssdCore(
	phoneNumber: string,
	text: string,
	env: Env,
): Promise<Response> {
	const supabaseUrl = env.SUPABASE_URL || "";
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
	const paystackSecret = env.PAYSTACK_SECRET_KEY || "";

	if (!supabaseUrl || !supabaseKey) {
		return textResponse(
			"END Server misconfiguration: missing Supabase credentials.",
		);
	}

	const supabase = createClient(supabaseUrl, supabaseKey);

	// OTP Resumption Interceptor
	const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
	const { data: pendingSession } = await supabase
		.from("ussd_sessions")
		.select("reference, amount")
		.eq("phone_number", phoneNumber)
		.eq("status", "pending")
		.gte("created_at", fiveMinsAgo)
		.order("created_at", { ascending: false })
		.limit(1)
		.single();

	if (pendingSession) {
		const rawTokens = text.split("*").filter(Boolean);

		if (rawTokens.length === 0) {
			return textResponse(
				`CON You have a pending payment of GHS ${pendingSession.amount}.\nEnter the OTP sent via SMS to confirm:\n0. Cancel`,
			);
		}
		const otpAnswer = rawTokens[rawTokens.length - 1];
		if (otpAnswer === "0") {
			await supabase
				.from("ussd_sessions")
				.update({ status: "cancelled" })
				.eq("reference", pendingSession.reference);
			text = "";
		} else {
			return await submitOtp(
				supabase,
				pendingSession.reference,
				otpAnswer,
				paystackSecret,
			);
		}
	}

	const rawInputArray = text.split("*").filter(Boolean);
	const inputArray = reduceTokens(rawInputArray);
	const depth = inputArray.length;

	// Welcome menu
	if (depth === 0) {
		const maxEvents = Number.parseInt(
			env.MAX_LISTED_EVENTS || `${MAX_LISTED_EVENTS}`,
			10,
		);
		const { data: events } = await supabase
			.from("events")
			.select("id, title, ussd_code")
			.eq("has_ussd", true)
			.order("created_at", { ascending: false })
			.limit(maxEvents);

		let menu = "CON AfroTix\n";
		if (events && events.length > 0) {
			events.forEach((ev: any, idx: number) => {
				menu += `${idx + 1}. ${ev.title}\n`;
			});
			menu += `${ENTER_CODE_OPTION}. Enter code\n`;
		} else {
			menu += "Enter event code:\n";
		}
		return textResponse(menu);
	}

	let tokens = [...inputArray];
	let event: any = null;

	if (tokens[0] === ENTER_CODE_OPTION) {
		tokens.shift();
		if (tokens.length === 0) {
			return textResponse("CON Enter event code:\n0. Back");
		}
		const eventCode = tokens.shift();
		event = await fetchEventByCode(supabase, eventCode!);
	} else {
		const firstInput = tokens[0];
		const selectedIdx = Number.parseInt(firstInput, 10);
		const maxEvents = Number.parseInt(
			env.MAX_LISTED_EVENTS || `${MAX_LISTED_EVENTS}`,
			10,
		);

		const { data: listedEvents } = await supabase
			.from("events")
			.select(EVENT_SELECT)
			.eq("has_ussd", true)
			.order("created_at", { ascending: false })
			.limit(maxEvents);

		if (listedEvents && selectedIdx >= 1 && selectedIdx <= listedEvents.length) {
			event = listedEvents[selectedIdx - 1];
			tokens.shift();
		} else {
			event = await fetchEventByCode(supabase, firstInput);
			tokens.shift();
		}
	}

	if (!event) {
		return textResponse("END Event not found. Check your code.");
	}

	const eventType = event.type;

	if (eventType === "voting") {
		return await handleVotingFlow(
			supabase,
			event,
			tokens,
			phoneNumber,
			paystackSecret,
		);
	}
	if (eventType === "ticketed") {
		return await handleTicketFlow(
			supabase,
			event,
			tokens,
			phoneNumber,
			paystackSecret,
		);
	}
	if (eventType === "standard" || eventType === "hybrid") {
		const modeStr = tokens.shift();
		if (!modeStr) {
			return textResponse(`CON ${event.title}\n1. Voting\n2. Tickets\n0. Back`);
		}
		if (modeStr === "1") {
			return await handleVotingFlow(
				supabase,
				event,
				tokens,
				phoneNumber,
				paystackSecret,
			);
		}
		if (modeStr === "2") {
			return await handleTicketFlow(
				supabase,
				event,
				tokens,
				phoneNumber,
				paystackSecret,
			);
		}
		return textResponse("END Invalid selection.");
	}

	return textResponse("END Unsupported event type.");
}

// Arkesel Response Converter
async function toArkeselResponse(
	atResponse: Response,
	sessionID: string,
	userID: string,
	msisdn: string,
) {
	const raw = await atResponse.text();
	const continueSession = raw.startsWith("CON");
	const message = raw.replace(/^(CON|END)\s*/, "");

	return jsonResponse({
		sessionID,
		userID,
		msisdn,
		message,
		continueSession,
	});
}

function normalizeArkeselInput(userData: string, newSession: boolean): string {
	const cleaned = userData.replace(/[#\uFF03]+$/, "");
	if (newSession) {
		const baseCodes = ["*384*77340", "*920"];
		for (const base of baseCodes) {
			if (cleaned.startsWith(base)) {
				const extra = cleaned.substring(base.length);
				if (extra.startsWith("*")) {
					return extra.substring(1);
				}
				return extra;
			}
		}
	}
	return cleaned;
}

// Cloudflare Worker Fetch Entrypoint (Africa's Talking & Arkesel)
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		try {
			const url = new URL(request.url);
			const contentType = request.headers.get("content-type") || "";
			const isArkeselRoute =
				url.pathname.includes("/arkesel") ||
				url.searchParams.get("provider") === "arkesel";

			// Parse payload
			let bodyData: any = {};
			let rawText = "";
			let phoneNumber = "";
			let sessionId = "";
			let userId = "";
			let isNewSession = false;

			if (contentType.includes("application/json")) {
				bodyData = (await request.json()) as any;
				phoneNumber =
					bodyData.phoneNumber || bodyData.msisdn || bodyData.msisdn || "";
				rawText =
					bodyData.text !== undefined
						? bodyData.text
						: bodyData.userData || bodyData.message || "";
				sessionId = bodyData.sessionId || bodyData.sessionID || "";
				userId = bodyData.userId || bodyData.userID || "";
				const typeStr = (bodyData.type || "").toLowerCase();
				isNewSession =
					bodyData.newSession === true || typeStr === "initiation";
			} else if (
				contentType.includes("application/x-www-form-urlencoded") ||
				contentType.includes("multipart/form-data")
			) {
				const formData = await request.formData();
				bodyData = Object.fromEntries(formData.entries());
				phoneNumber = (formData.get("phoneNumber") ||
					formData.get("msisdn") ||
					"") as string;
				rawText = (formData.get("text") ||
					formData.get("userData") ||
					formData.get("message") ||
					"") as string;
				sessionId = (formData.get("sessionId") ||
					formData.get("sessionID") ||
					"") as string;
				userId = (formData.get("userId") ||
					formData.get("userID") ||
					"") as string;
				const typeStr = (
					(formData.get("type") as string) || ""
				).toLowerCase();
				isNewSession =
					formData.get("newSession") === "true" || typeStr === "initiation";
			} else {
				phoneNumber =
					url.searchParams.get("phoneNumber") ||
					url.searchParams.get("msisdn") ||
					"";
				rawText =
					url.searchParams.get("text") ||
					url.searchParams.get("userData") ||
					"";
				sessionId = url.searchParams.get("sessionId") || "";
			}

			// Arkesel USSD flow
			if (isArkeselRoute || bodyData.sessionID || bodyData.msisdn) {
				const currentInput = normalizeArkeselInput(rawText, isNewSession);
				let accumulatedPath = currentInput;

				if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
					const supabase = createClient(
						env.SUPABASE_URL,
						env.SUPABASE_SERVICE_ROLE_KEY,
					);
					if (!isNewSession && sessionId) {
						const { data: state } = await supabase
							.from("ussd_states")
							.select("accumulated_path")
							.eq("session_id", sessionId)
							.single();

						if (state && state.accumulated_path) {
							accumulatedPath = `${state.accumulated_path}*${currentInput}`;
						}
					}

					if (sessionId) {
						await supabase.from("ussd_states").upsert(
							{
								session_id: sessionId,
								accumulated_path: accumulatedPath,
							},
							{ onConflict: "session_id" },
						);
					}
				}

				const atResponse = await handleUssdCore(
					phoneNumber,
					accumulatedPath,
					env,
				);
				return await toArkeselResponse(
					atResponse,
					sessionId,
					userId,
					phoneNumber,
				);
			}

			// Africa's Talking USSD flow (Default)
			return await handleUssdCore(phoneNumber, rawText, env);
		} catch (error: any) {
			console.error("USSD Worker Error:", error);
			return textResponse("END Something went wrong. Try again later.");
		}
	},
};
