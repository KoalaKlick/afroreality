import { NextResponse } from "next/server";
import { getActiveFextivaEvents, getActiveFextivaOrganizations } from "@/lib/dal/public";
import { getFrontendBaseUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

function formatDate(date?: Date | string | null): string {
	if (!date) return new Date().toISOString();
	try {
		return new Date(date).toISOString();
	} catch {
		return new Date().toISOString();
	}
}

export async function GET() {
	// Canonical serving domain on Vercel is https://www.fextiva.com
	const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
	let baseUrl = "https://www.fextiva.com";

	if (configuredUrl && !configuredUrl.includes("localhost")) {
		const clean = configuredUrl.replace(/\/$/, "");
		// Force canonical www host to prevent Google Search Console redirect chains
		baseUrl =
			clean === "https://fextiva.com" || clean === "http://fextiva.com"
				? "https://www.fextiva.com"
				: clean;
	}

	const [events, organizations] = await Promise.all([
		getActiveFextivaEvents(),
		getActiveFextivaOrganizations(),
	]);

	const urls: string[] = [];

	// 1. Core Primary Routes (Homepage, Events, Register, Login)
	const baseRoutes = [
		{ path: "/", priority: "1.0", changefreq: "daily" },
		{ path: "/events", priority: "1.0", changefreq: "daily" },
		{ path: "/register", priority: "0.9", changefreq: "monthly" },
		{ path: "/login", priority: "0.8", changefreq: "monthly" },
		{ path: "/voting", priority: "0.95", changefreq: "daily" },
		{ path: "/pubs", priority: "0.90", changefreq: "daily" },
	];

	const nowIso = new Date().toISOString();

	for (const route of baseRoutes) {
		urls.push(`
  <url>
    <loc>${escapeXml(`${baseUrl}${route.path}`)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
	}

	// 2. Active Events (Hourly for real-time shifts, 0.9 for voting, 0.8 for general events)
	for (const event of events) {
		const isVoting = event.type === "voting" || event.type === "hybrid";
		const priority = isVoting ? "0.9" : "0.8";
		const eventPath = event.organization?.slug
			? `/${event.organization.slug}/event/${event.slug}`
			: `/${event.id}`;
		const loc = `${baseUrl}${eventPath}`;
		const lastmod = formatDate(event.updatedAt);

		urls.push(`
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${priority}</priority>
  </url>`);

		// Event Voting Categories (if present)
		if (event.organization?.slug && event.votingCategories?.length) {
			for (const cat of event.votingCategories) {
				const catLoc = `${baseUrl}/${event.organization.slug}/event/${event.slug}/category/${cat.id}`;
				const catLastmod = formatDate(cat.updatedAt || event.updatedAt);
				urls.push(`
  <url>
    <loc>${escapeXml(catLoc)}</loc>
    <lastmod>${catLastmod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.85</priority>
  </url>`);
			}
		}
	}

	// 3. Active Organizations (Priority 0.7, Daily)
	for (const org of organizations) {
		const orgLoc = `${baseUrl}/${org.slug}`;
		const orgLastmod = formatDate(org.updatedAt);
		urls.push(`
  <url>
    <loc>${escapeXml(orgLoc)}</loc>
    <lastmod>${orgLastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`);
	}

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`.trim();

	return new NextResponse(xml, {
		status: 200,
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			// Max-age edge cache of 1 hour with stale-while-revalidate protection
			"Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
