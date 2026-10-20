import { verifyAndCheckInTicket } from "@/lib/server-functions/public-checkout";
import { TicketVerifyClient } from "./TicketVerifyClient";
import { getAuthState } from "@/lib/auth-guards";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function GateLockSvg({ className = "size-20" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<circle cx="32" cy="32" r="30" fill="url(#gate-grad)" />
			<circle cx="32" cy="32" r="26" fill="#3B82F6" />
			<path
				d="M25 28V23.5C25 19.634 28.134 16.5 32 16.5C35.866 16.5 39 19.634 39 23.5V28"
				stroke="white"
				strokeWidth="3.5"
				strokeLinecap="round"
			/>
			<rect x="22" y="28" width="20" height="17" rx="3.5" fill="white" />
			<circle cx="32" cy="36" r="2" fill="#2563EB" />
			<path d="M32 38V41" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
			<defs>
				<linearGradient
					id="gate-grad"
					x1="6"
					y1="6"
					x2="58"
					y2="58"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#60A5FA" />
					<stop offset="1" stopColor="#1D4ED8" />
				</linearGradient>
			</defs>
		</svg>
	);
}

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
					<div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between text-xs">
						<span className="font-bold tracking-tight text-foreground flex items-center gap-2">
							<ShieldCheck className="size-4 text-primary" />
							Gate Verification
						</span>
						<Button asChild variant="ghost" size="sm" className="h-8 text-xs">
							<Link href={`/login?next=${encodeURIComponent(returnUrl)}`}>
								Sign In
							</Link>
						</Button>
					</div>
				</header>

				<main className="max-w-md w-full mx-auto px-4 py-16 flex flex-col items-center text-center space-y-6">
					<GateLockSvg className="size-20" />

					<div className="space-y-2">
						<h1 className="text-2xl font-black text-foreground tracking-tight">
							Organizer Sign-In Required
						</h1>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Sign in with an event organizer account to verify attendee tickets and manage door admission.
						</p>
					</div>

					<Button asChild size="lg" className="w-full h-12 text-sm font-bold shadow-none">
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
				<div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between text-xs">
					<div className="flex items-center gap-2 font-bold text-foreground">
						<ShieldCheck className="size-4 text-primary" />
						<span>Gate Access</span>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-xs font-medium">
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

			<footer className="py-6 border-t border-border/40 mt-12">
				<PoweredByFooter />
			</footer>
		</div>
	);
}
