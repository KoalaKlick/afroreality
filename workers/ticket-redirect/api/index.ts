// workers/ticket-redirect/api/index.ts
// Vercel Edge entrypoint for t.fextiva.com redirect.

import { handleTicketRedirect } from "../src/index";

export const config = {
	runtime: "edge",
};

export default function handler(request: Request) {
	return handleTicketRedirect(request);
}

