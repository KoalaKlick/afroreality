import type { Metadata } from "next";
import { LandingNavbar } from "@/components/Landing/LandingNavbar";
import { UssdFloatingWidget } from "@/components/event/public/UssdFloatingWidget";
import { PROJ_NAME } from "@/lib/constants/branding";

export const metadata: Metadata = {
	title: `Discover Events & Organizers | ${PROJ_NAME}`,
	description:
		"Find amazing events with ticket sales and voting happening right now. Discover top organizers on our platform.",
};

export default function LandingGroupLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-background text-foreground antialiased select-auto w-full overflow-x-hidden">
			<LandingNavbar />
			<div className="pt-16">{children}</div>

			{/* Floating Root USSD QR Code Widget */}
			<UssdFloatingWidget
				eventTitle={`${PROJ_NAME} African Ticketing & Voting`}
				ussdCode="root"
				primaryColor="#e88722"
			/>
		</div>
	);
}
