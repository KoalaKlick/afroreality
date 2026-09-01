import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { TicketVerifyClient } from "./TicketVerifyClient";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TicketVerifyPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
	title: "Gate Verification & Access Control | fextiva",
	description: "Official event gate scanner and ticket validation portal.",
};

export default async function TicketVerifyPage({
	searchParams,
}: TicketVerifyPageProps) {
	const params = await searchParams;
	const token = typeof params.token === "string" ? params.token : "";
	const ticketCode =
		typeof params.ticketCode === "string"
			? params.ticketCode
			: typeof params.code === "string"
				? params.code
				: "";

	let initialData: any = null;

	if (token || ticketCode) {
		initialData = await verifyAndCheckInTicket({
			data: {
				token: token || undefined,
				ticketCode: ticketCode || undefined,
				action: "status",
			},
		});
	}

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			{/* Top Bar */}
			<header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40">
				<div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between text-xs">
					<div className="flex items-center gap-2 font-bold text-foreground">
						<ShieldCheck className="size-4 text-primary" />
						<span>Gate Access &amp; Scanner</span>
					</div>

					<Button asChild variant="ghost" size="sm" className="h-8 text-xs gap-1">
						<Link href="/dashboard">Dashboard</Link>
					</Button>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 space-y-6">
				<div className="text-center space-y-1">
					<h1 className="text-2xl font-black text-foreground tracking-tight">
						Ticket Verification
					</h1>
					<p className="text-xs text-muted-foreground">
						Scan attendee QR codes or look up ticket numbers for door entry.
					</p>
				</div>

				<TicketVerifyClient
					initialToken={token}
					initialTicket={initialData?.ticket}
					initialStatus={initialData?.status}
					initialMessage={initialData?.message}
					isValid={initialData ? initialData.isValid : true}
				/>
			</main>

			<PanAfricanDivider className="my-10" />
			<PoweredByFooter />
		</div>
	);
}
