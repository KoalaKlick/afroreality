"use client";
// src/components/organization/invite/InviteAcceptClient.tsx

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AfricaMap, fextivaLogo } from "@/components/shared/africa-map";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { useAuth } from "@/hooks/use-auth";
import { AcceptButton } from "./AcceptButton";
import { InviteCardHeader } from "./InviteCardHeader";
import { InviteLoginForm } from "./InviteLoginForm";
import { InviteRegisterForm } from "./InviteRegisterForm";
import type { InviteDetails } from "./types";

interface InviteAcceptClientProps {
	readonly token: string;
	readonly invite: InviteDetails;
	/** The currently authenticated user's email, or null if not signed in */
	readonly currentUserEmail: string | null;
	/** True if the invited email already has an account */
	readonly isExistingUser: boolean;
}

export function InviteAcceptClient({
	token,
	invite,
	currentUserEmail,
	isExistingUser,
}: InviteAcceptClientProps) {
	const router = useRouter();
	const { signOut } = useAuth();

	const emailMatches =
		currentUserEmail?.toLowerCase() === invite.email.toLowerCase();

	const bannerUrl = getOrgImageUrl(invite.organization.bannerUrl);

	const mapImages = bannerUrl
		? [bannerUrl, "/landing/g.webp"]
		: ["/landing/g.webp", "/landing/b.webp", "/landing/h.webp"];

	const handleSignOut = async () => {
		await signOut();
		router.refresh();
	};

	return (
		<div className="min-h-dvh bg-background lg:bg-transparent flex flex-col lg:flex-row font-poppins">
			{/* Left hero / brand side with AfricaMap (no shadow) */}
			<div className="relative w-full lg:w-1/2 h-[35dvh] lg:h-screen overflow-hidden bg-secondary-50 flex-shrink-0">
				<AfricaMap
					images={mapImages}
					interval={9000}
					showHoverColor={true}
					showTransitionColor={false}
				/>

				<div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 lg:space-y-6 max-w-[15rem] sm:max-w-[18rem] md:max-w-xs pointer-events-none z-10">
					<div className="flex items-center gap-2">
						<Link href="/" className="pointer-events-auto">
							<fextivaLogo className="w-28 sm:w-32 md:w-36 lg:w-40 h-auto p-2 bg-secondary-50/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg" />
						</Link>
					</div>
					<span className="mt-2 text-sm inline-block bg-secondary-50/90 dark:bg-zinc-900/90 px-2 py-1 backdrop-blur-sm font-medium text-foreground/80 rounded">
						Join {invite.organization.name} on fextiva
					</span>
				</div>
			</div>

			{/* Right auth content */}
			<div className="relative z-10 flex-1 flex flex-col bg-background rounded-t-[2.5rem] lg:rounded-none -mt-10 lg:mt-0 px-8 py-10 lg:px-16 items-center justify-center">
				<div className="w-full max-w-md h-full flex flex-col justify-center space-y-8">
					<div>
						<InviteCardHeader invite={invite} />
					</div>

					<div className="h-px bg-border w-full" />

					{/* Already signed in */}
					{currentUserEmail && (
						<div className="space-y-4">
							{emailMatches ? (
								<AcceptButton
									token={token}
									organizationName={invite.organization.name}
								/>
							) : (
								<div className="border border-amber-500/30 bg-amber-500/5 p-4 text-sm space-y-2 rounded-xl">
									<p>
										This invitation was sent to{" "}
										<em>{invite.email}</em>. You&apos;re currently signed in as{" "}
										<em>{currentUserEmail}</em>.
									</p>
									<p>
										<button
											className="font-medium text-destructive hover:underline"
											type="button"
											onClick={handleSignOut}
										>
											Log out
										</button>{" "}
										from the current email to continue
									</p>
								</div>
							)}
							<p className="text-center text-xs text-muted-foreground">
								Signed in as {currentUserEmail}
							</p>
						</div>
					)}

					{/* Not signed in: existing user -> login form only */}
					{!currentUserEmail && isExistingUser && (
						<InviteLoginForm
							token={token}
							email={invite.email}
							organizationName={invite.organization.name}
						/>
					)}

					{/* Not signed in: new user -> register form only */}
					{!currentUserEmail && !isExistingUser && (
						<InviteRegisterForm
							token={token}
							email={invite.email}
							organizationName={invite.organization.name}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
