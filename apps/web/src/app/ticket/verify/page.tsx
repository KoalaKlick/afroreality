import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { TicketVerifyClient } from "./TicketVerifyClient";
import { getAuthState } from "@/lib/auth-guards";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShieldCheck } from "lucide-react";
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
			<div className="min-h-screen bg-background text-foreground flex flex-col">
				<header className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
					<div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
						<span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-2">
							<ShieldCheck className="size-4 text-primary" />
							Gate Verification
						</span>
						<Button asChild variant="ghost" size="sm" className="h-8 text-xs">
							<Link href={`/login?next=${encodeURIComponent(returnUrl)}`}>
								Sign in
							</Link>
						</Button>
					</div>
				</header>

				<main className="flex-1 flex items-center justify-center px-4 py-16">
					<div className="w-full max-w-md rounded-xl border border-border/70 bg-card">
						<EmptyState
							variant="locked"
							title="Organizer sign-in required"
							description="Sign in with an event organizer account to verify attendee tickets at the door."
							action={
								<Button asChild size="sm" className="h-9 px-5 text-xs font-semibold">
									<Link href={`/login?next=${encodeURIComponent(returnUrl)}`}>
										Sign in to verify
									</Link>
								</Button>
							}
							className="py-12"
						/>
					</div>
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
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			<header className="border-b border-border/60 bg-card/40 backdrop-blur-sm sticky top-0 z-40">
				<div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
					<span className="text-xs font-semibold text-foreground flex items-center gap-2">
						<ShieldCheck className="size-4 text-primary" />
						Gate Verification
					</span>

					<div className="flex items-center gap-3">
						<span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-xs">
							{auth.fullName || auth.email}
						</span>
						<Button asChild variant="ghost" size="sm" className="h-8 text-xs px-2.5">
							<Link href="/dashboard">Dashboard</Link>
						</Button>
					</div>
				</div>
			</header>

			<main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-10">
				<TicketVerifyClient
					initialToken={token}
					initialTicket={initialData?.ticket}
					initialStatus={initialData?.status}
					initialMessage={initialData?.message}
					isValid={initialData ? initialData.isValid : true}
					verifierName={auth.fullName || auth.email}
				/>
			</main>

			<footer className="py-6 border-t border-border/40 mt-auto">
				<PoweredByFooter />
			</footer>
		</div>
	);
}
