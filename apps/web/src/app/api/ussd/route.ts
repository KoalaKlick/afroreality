import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getUssdRootCode } from "@/lib/utils/ussd";

// ─── Helpers ───
function textResponse(text: string) {
	return new NextResponse(text, {
		status: 200,
		headers: {
			"Content-Type": "text/plain",
		},
	});
}

function normalizePhone(phone: string): string {
	let local = phone.replace(/^\+?233/, "0");
	if (local.startsWith("00")) local = local.substring(1);
	return local;
}

function getMobileNetwork(phone: string): "mtn" | "vod" | "tgo" {
	const local = normalizePhone(phone);
	const prefix = local.substring(0, 3);
	if (["024", "054", "055", "059", "025", "053"].includes(prefix)) return "mtn";
	if (["020", "050"].includes(prefix)) return "vod";
	if (["027", "057", "026", "056"].includes(prefix)) return "tgo";
	return "mtn";
}

/**
 * Inbound USSD Webhook Handler
 * Supports Africa's Talking, Arkesel, and standard form-encoded or JSON USSD gateways.
 */
export async function POST(req: NextRequest) {
	try {
		let phoneNumber = "";
		let text = "";
		let sessionId = "";
		let serviceCode = "";

		const contentType = req.headers.get("content-type") || "";

		if (contentType.includes("application/x-www-form-urlencoded")) {
			const bodyText = await req.text();
			const params = new URLSearchParams(bodyText);
			phoneNumber = params.get("phoneNumber") || params.get("msisdn") || "";
			text = params.get("text") || params.get("ussdString") || "";
			sessionId = params.get("sessionId") || params.get("session_id") || "";
			serviceCode = params.get("serviceCode") || params.get("service_code") || "";
		} else if (contentType.includes("application/json")) {
			const json = await req.json();
			phoneNumber = json.phoneNumber || json.msisdn || "";
			text = json.text || json.ussdString || "";
			sessionId = json.sessionId || json.session_id || "";
			serviceCode = json.serviceCode || json.service_code || "";
		} else {
			const bodyText = await req.text();
			const params = new URLSearchParams(bodyText);
			phoneNumber = params.get("phoneNumber") || params.get("msisdn") || "";
			text = params.get("text") || "";
			sessionId = params.get("sessionId") || "";
			serviceCode = params.get("serviceCode") || "";
		}

		// Clean up text tokens (e.g. "104*1*2")
		const trimmedText = text.trim();
		const tokens = trimmedText ? trimmedText.split("*") : [];

		// ─── Step 0: Welcome / Direct Event Extension Code Lookup ───
		if (tokens.length === 0) {
			// User dialed root code directly without extension
			return textResponse(
				"CON Welcome to AfroReality\nPlease enter the 3-digit Event Code (e.g. 104):",
			);
		}

		const eventCode = tokens[0]?.trim();

		// Find the event by ussdCode
		const event = await prisma.event.findFirst({
			where: {
				ussdCode: eventCode,
				hasUssd: true,
			},
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						slug: true,
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
			},
		});

		if (!event) {
			return textResponse(
				`END Invalid event code (${eventCode}). Please check the code and dial again.`,
			);
		}

		const hasTickets = event.ticketTypes.length > 0;
		const hasVoting = event.votingCategories.length > 0;

		// ─── Step 1: Event Main Menu ───
		if (tokens.length === 1) {
			let menu = `CON ${event.title}\n`;
			if (hasTickets && hasVoting) {
				menu += "1. Buy Tickets\n2. Cast Votes\n";
			} else if (hasTickets) {
				menu += "1. Buy Tickets\n";
			} else if (hasVoting) {
				menu += "1. Cast Votes\n";
			} else {
				return textResponse(`END ${event.title}\nNo tickets or voting active at this time.`);
			}
			return textResponse(menu);
		}

		const actionChoice = tokens[1]?.trim();

		// Determine if user chose ticketing or voting
		const isTickets =
			(hasTickets && hasVoting && actionChoice === "1") ||
			(hasTickets && !hasVoting && actionChoice === "1");

		const isVotes =
			(hasTickets && hasVoting && actionChoice === "2") ||
			(!hasTickets && hasVoting && actionChoice === "1");

		// ─── TICKETING FLOW ───
		if (isTickets) {
			// Step 2: Select Ticket Tier
			if (tokens.length === 2) {
				let menu = `CON Select Ticket:\n`;
				event.ticketTypes.forEach((tier, idx) => {
					menu += `${idx + 1}. ${tier.name} - GHS ${Number(tier.price).toFixed(2)}\n`;
				});
				return textResponse(menu);
			}

			const tierIdx = parseInt(tokens[2] || "1", 10) - 1;
			const selectedTier = event.ticketTypes[tierIdx];

			if (!selectedTier) {
				return textResponse("END Invalid ticket selection. Please dial again.");
			}

			// Step 3: Enter Quantity
			if (tokens.length === 3) {
				return textResponse(
					`CON ${selectedTier.name} (GHS ${Number(selectedTier.price).toFixed(2)})\nEnter Quantity (1-10):`,
				);
			}

			const qty = Math.max(1, Math.min(10, parseInt(tokens[3] || "1", 10) || 1));
			const totalAmount = Number(selectedTier.price) * qty;

			// Step 4: Confirmation & Mobile Money Prompt
			const cleanPhone = normalizePhone(phoneNumber);
			const network = getMobileNetwork(cleanPhone);

			// Trigger out-of-band charge via Paystack if configured
			const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
			const reference = `USSD-TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

			if (paystackSecret && totalAmount > 0) {
				try {
					fetch("https://api.paystack.co/charge", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${paystackSecret}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							email: `ussd+${cleanPhone}@afroreality.com`,
							amount: Math.round(totalAmount * 100), // in pesewas
							reference,
							currency: "GHS",
							mobile_money: {
								phone: cleanPhone,
								provider: network,
							},
							metadata: {
								eventId: event.id,
								ticketTypeId: selectedTier.id,
								quantity: qty,
								channel: "ussd",
							},
						}),
					}).catch((err) => {
						console.error("[USSD-PAYSTACK-ERROR]", err);
					});
				} catch (e) {
					console.error("[USSD-CHARGE-EXCEPTION]", e);
				}
			}

			return textResponse(
				`END Total: GHS ${totalAmount.toFixed(2)} for ${qty}x ${selectedTier.name}.\nPlease check your phone for the Mobile Money PIN prompt to approve payment.`,
			);
		}

		// ─── VOTING FLOW ───
		if (isVotes) {
			// Step 2: Select Voting Category
			if (tokens.length === 2) {
				let menu = `CON Select Category:\n`;
				event.votingCategories.forEach((cat, idx) => {
					menu += `${idx + 1}. ${cat.name}\n`;
				});
				return textResponse(menu);
			}

			const catIdx = parseInt(tokens[2] || "1", 10) - 1;
			const selectedCat = event.votingCategories[catIdx];

			if (!selectedCat) {
				return textResponse("END Invalid category selection. Please dial again.");
			}

			const nominees = selectedCat.votingOptions || [];
			if (nominees.length === 0) {
				return textResponse(`END No nominees currently registered in ${selectedCat.name}.`);
			}

			// Step 3: Select Nominee
			if (tokens.length === 3) {
				let menu = `CON ${selectedCat.name}:\n`;
				nominees.forEach((nom, idx) => {
					menu += `${idx + 1}. ${nom.optionText}\n`;
				});
				return textResponse(menu);
			}

			const nomIdx = parseInt(tokens[3] || "1", 10) - 1;
			const selectedNom = nominees[nomIdx];

			if (!selectedNom) {
				return textResponse("END Invalid nominee selection. Please dial again.");
			}

			// Step 4: Number of votes
			const unitVotePrice = Number(selectedCat.votePrice || 1);
			if (tokens.length === 4) {
				return textResponse(
					`CON Vote for ${selectedNom.optionText}\nPrice: GHS ${unitVotePrice.toFixed(2)}/vote\nEnter number of votes:`,
				);
			}

			const voteCount = Math.max(1, parseInt(tokens[4] || "1", 10) || 1);
			const totalVoteAmount = unitVotePrice * voteCount;
			const cleanPhone = normalizePhone(phoneNumber);
			const network = getMobileNetwork(cleanPhone);

			const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
			const reference = `USSD-VOTE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

			if (paystackSecret && totalVoteAmount > 0) {
				try {
					fetch("https://api.paystack.co/charge", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${paystackSecret}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							email: `ussd+${cleanPhone}@afroreality.com`,
							amount: Math.round(totalVoteAmount * 100),
							reference,
							currency: "GHS",
							mobile_money: {
								phone: cleanPhone,
								provider: network,
							},
							metadata: {
								eventId: event.id,
								categoryId: selectedCat.id,
								votingOptionId: selectedNom.id,
								voteCount,
								channel: "ussd",
							},
						}),
					}).catch((err) => {
						console.error("[USSD-PAYSTACK-VOTE-ERROR]", err);
					});
				} catch (e) {
					console.error("[USSD-CHARGE-VOTE-EXCEPTION]", e);
				}
			}

			return textResponse(
				`END Total: GHS ${totalVoteAmount.toFixed(2)} for ${voteCount} vote(s) for ${selectedNom.optionText}.\nPlease authorize the Mobile Money PIN prompt on your screen to submit votes.`,
			);
		}

		return textResponse("END Invalid choice. Please dial again.");
	} catch (error: any) {
		console.error("[USSD-WEBHOOK-ERROR]", error);
		return textResponse("END System busy. Please try again later.");
	}
}
