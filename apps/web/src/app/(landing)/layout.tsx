import type { Metadata } from "next";
import { LandingNavbar } from "@/components/Landing/LandingNavbar";
import { LandingFooter } from "@/components/Landing/LandingFooter";
import { PROJ_NAME } from "@/lib/constants/branding";

export const metadata: Metadata = {
	title: `Events & Experience Discovery | ${PROJ_NAME}`,
	description:
		"Discover upcoming Pan-African festivals, conferences, concerts, awards ceremonies, and live voting competitions.",
};

export default function LandingGroupLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500/20 selection:text-emerald-700">
			<LandingNavbar />
			<main className="flex-1">{children}</main>
			<LandingFooter />
		</div>
	);
}
