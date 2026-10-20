import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { TicketVerifyClient } from "./TicketVerifyClient";
import { getAuthState } from "@/lib/auth-guards";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TicketVerifyPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata = {
	title: "Ticket Verification | fextiva",
	description: "Event gate check-in and access control.",
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

	const query = new URLSearchParams();
	if (token) query.set("token", token);
	if (ticketCode) query.set("code", ticketCode);
	const returnUrl = `/ticket/verify${query.toString() ? `?${query.toString()}` : ""}`;

	const auth = await getAuthState();

	if (!auth) {
		return (
			<div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
				<header className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
					<div className="max-w-md mx-auto px-4 h-12 flex items-center justify-between text-xs">
						<span className="font-semibold tracking-tight text-foreground flex items-center gap-1.5">
							<ShieldCheck className="size-3.5 text-primary" />
							Gate Verification
						</span>
						<Button asChild variant="ghost" size="sm" className="h-7 text-xs">
							<Link href={`/login?next=${encodeURIComponent(returnUrl)}`}>
								Sign In
							</Link>
						</Button>
					</div>
				</header>

				<main className="max-w-sm w-full mx-auto px-4 py-16 flex flex-col items-center text-center space-y-4">
					<div className="size-9 rounded-full bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground">
						<Lock className="size-4" />
					</div>

					<div className="space-y-1">
						<h1 className="text-base font-bold text-foreground">
							Verifier Sign-In Required
						</h1>
						<p className="text-xs text-muted-foreground">
							Sign in with an organizer account to verify tickets and admit attendees.
						</p>
					</div>

					<Button asChild size="sm" className="w-full text-xs font-semibold h-9">
						<Link href={`/login?next=${encodeURIComponent(returnUrl)}`}>
							Sign In to Verify
						</Link>
					</Button>
				</main>

				<footer className="py-6 border-t border-border/40">
					<PoweredByFooter />
				</footer>
			</div>
		);
	}

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
		<div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
			<header className="border-b border-border/60 bg-card/40 backdrop-blur-sm sticky top-0 z-40">
				<div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between text-xs">
					<div className="flex items-center gap-1.5 font-semibold text-foreground">
						<ShieldCheck className="size-3.5 text-primary" />
						<span>Gate Access</span>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-[11px] text-muted-foreground truncate max-w-[140px] sm:max-w-xs">
							{auth.fullName || auth.email}
						</span>
						<Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
							<Link href="/dashboard">Dashboard</Link>
						</Button>
					</div>
				</div>
			</header>

			<main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 sm:py-8 space-y-5">
				<div className="space-y-0.5">
					<h1 className="text-lg font-bold text-foreground tracking-tight">
						Ticket Check-In
					</h1>
					<p className="text-xs text-muted-foreground">
						Scan attendee QR pass or enter ticket code.
					</p>
				</div>

				<TicketVerifyClient
					initialToken={token}
					initialTicket={initialData?.ticket}
					initialStatus={initialData?.status}
					initialMessage={initialData?.message}
					isValid={initialData ? initialData.isValid : true}
					verifierName={auth.fullName || auth.email}
				/>
			</main>

			<footer className="py-6 border-t border-border/40 mt-12">
				<PoweredByFooter />
			</footer>
		</div>
	);
}
