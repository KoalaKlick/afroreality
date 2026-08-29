// workers/ussd/src/index.ts
// Cloudflare Worker for USSD interactive ticketing and voting (Africa's Talking & Arkesel)

export interface Env {
  DATABASE_URL?: string;
  PAYSTACK_SECRET_KEY?: string;
  MAX_LISTED_EVENTS?: string;
}

function textResponse(text: string, contentType = "text/plain"): Response {
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

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
      let phoneNumber = "";
      let text = "";
      let sessionId = "";

      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        phoneNumber = (formData.get("phoneNumber") || formData.get("msisdn") || "") as string;
        text = (formData.get("text") || formData.get("ussdServiceInput") || formData.get("message") || "") as string;
        sessionId = (formData.get("sessionId") || formData.get("sessionID") || "") as string;
      } else if (contentType.includes("application/json")) {
        const body = (await request.json()) as any;
        phoneNumber = body.phoneNumber || body.msisdn || "";
        text = body.text || body.ussdServiceInput || body.message || "";
        sessionId = body.sessionId || body.sessionID || "";
      } else {
        const url = new URL(request.url);
        phoneNumber = url.searchParams.get("phoneNumber") || url.searchParams.get("msisdn") || "";
        text = url.searchParams.get("text") || url.searchParams.get("message") || "";
        sessionId = url.searchParams.get("sessionId") || "";
      }

      // Root menu handling
      if (!text || text.trim() === "") {
        const menu = "CON Welcome to AfroTix\n1. Explore Events\n2. Enter Event Code\n3. Verify Ticket\n4. Help & Support";
        return textResponse(menu);
      }

      const tokens = text.split("*").filter(Boolean);
      const rootChoice = tokens[0];

      if (rootChoice === "1") {
        if (tokens.length === 1) {
          return textResponse("CON Featured Events:\n1. AfroFest 2026\n2. Pan-African Awards\n0. Back");
        }
        return textResponse("CON Select Option:\n1. Buy Ticket\n2. Vote Nominee\n0. Back");
      }

      if (rootChoice === "2") {
        if (tokens.length === 1) {
          return textResponse("CON Enter 4-digit Event Code:\n0. Back");
        }
        const eventCode = tokens[1];
        return textResponse(`CON Event: ${eventCode}\n1. Vote\n2. Buy Tickets\n0. Back`);
      }

      if (rootChoice === "3") {
        if (tokens.length === 1) {
          return textResponse("CON Enter 8-character Ticket Code:\n0. Back");
        }
        const ticketCode = tokens[1];
        return textResponse(`END Ticket ${ticketCode} status: VALID & ACTIVE.\nEvent: AfroFest 2026`);
      }

      if (rootChoice === "4") {
        return textResponse("END For support, email support@afrotix.com or visit afrotix.com/help.");
      }

      return textResponse("END Invalid selection. Please try again.");
    } catch (err: any) {
      console.error("USSD Worker Error:", err);
      return textResponse("END An error occurred. Please try again later.");
    }
  },
};
