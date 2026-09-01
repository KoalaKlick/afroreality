export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getInvitationByToken } from "@/lib/server-functions/organization-join";
import { getSession } from "@/lib/session";
import { InviteAcceptClient } from "@/components/organization/invite/InviteAcceptClient";

interface InviteTokenPageProps {
	params: Promise<{ token: string }>;
}

export async function generateMetadata({
	params,
}: InviteTokenPageProps): Promise<Metadata> {
	const { token } = await params;
	if (!token) return { title: "Invalid Invitation" };

	const invite = await getInvitationByToken(token);
	if (!invite) return { title: "Invitation Not Found" };

	return {
		title: `Join ${invite.organization.name} - fextiva`,
		description: `You've been invited to join ${invite.organization.name} as a ${invite.role}.`,
	};
}

export default async function InviteTokenPage({
	params,
}: InviteTokenPageProps) {
	const { token } = await params;

	if (!token) {
		notFound();
	}

	const invite = await getInvitationByToken(token);

	if (!invite) {
		return (
			<div className="min-h-[70vh] flex items-center justify-center px-4">
				<div className="text-center max-w-sm space-y-3">
					<h1 className="text-2xl font-bold">Invitation not found</h1>
					<p className="text-muted-foreground text-sm">
						This invitation link is invalid or has already been used.
					</p>
				</div>
			</div>
		);
	}

	if (invite.status !== "pending") {
		return (
			<div className="min-h-[70vh] flex items-center justify-center px-4">
				<div className="text-center max-w-sm space-y-3">
					<h1 className="text-2xl font-bold capitalize">
						Invitation {invite.status}
					</h1>
					<p className="text-muted-foreground text-sm">
						{invite.status === "accepted"
							? "This invitation has already been accepted."
							: "This invitation has expired or been declined."}
					</p>
					<div className="pt-2">
						<Link
							href="/dashboard"
							className="text-sm font-medium text-primary hover:underline"
						>
							Go to Dashboard &rarr;
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
		return (
			<div className="min-h-[70vh] flex items-center justify-center px-4">
				<div className="text-center max-w-sm space-y-3">
					<h1 className="text-2xl font-bold">Invitation expired</h1>
					<p className="text-muted-foreground text-sm">
						This invitation link has expired. Please ask{" "}
						{invite.inviter?.fullName ?? "the organizer"} to send a new one.
					</p>
				</div>
			</div>
		);
	}

	const session = await getSession();
	const currentUserEmail = session?.email ?? null;
	const isExistingUser = invite.userExists ?? false;

	return (
		<InviteAcceptClient
			token={token}
			invite={{
				id: invite.id,
				email: invite.email,
				role: invite.role,
				expiresAt: invite.expiresAt,
				organization: invite.organization,
				inviter: invite.inviter
					? {
							fullName: invite.inviter.fullName,
							avatarUrl: invite.inviter.avatarUrl,
						}
					: null,
			}}
			currentUserEmail={currentUserEmail}
			isExistingUser={isExistingUser}
		/>
	);
}
