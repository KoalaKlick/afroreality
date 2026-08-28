"use client";
// src/components/organization/invite/InviteCardHeader.tsx

import type { InviteDetails } from "./types";

interface Props {
	readonly invite: InviteDetails;
}

export function InviteCardHeader({ invite }: Props) {
	const rolePrefix = /^[aeiou]/i.test(invite.role) ? "an" : "a";

	return (
		<div className="space-y-1.5">
			<p className="text-base sm:text-lg text-foreground leading-relaxed">
				You have been invited
				{invite.inviter?.fullName ? (
					<>
						{" "}
						by{" "}
						<span className="font-semibold text-foreground">
							{invite.inviter.fullName}
						</span>
					</>
				) : null}{" "}
				to join{" "}
				<span className="font-semibold text-foreground">
					{invite.organization.name}
				</span>{" "}
				as {rolePrefix}{" "}
				<span className="font-semibold text-foreground capitalize">
					{invite.role}
				</span>
				.
			</p>
			<p className="text-xs text-muted-foreground">
				Sent to <span className="font-medium text-foreground">{invite.email}</span>
			</p>
		</div>
	);
}
