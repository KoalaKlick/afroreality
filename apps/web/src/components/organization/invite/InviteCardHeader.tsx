// src/components/organization/invite/card-header.tsx
import { Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import type { InviteDetails } from "./types";

interface Props {
	readonly invite: InviteDetails;
}

export function InviteCardHeader({ invite }: Props) {
	const logoUrl = getOrgImageUrl(invite.organization.logoUrl);

	const orgInitials = invite.organization.name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	const roleLabel =
		invite.role.charAt(0).toUpperCase() + invite.role.slice(1);

	const expiresLabel = invite.expiresAt
		? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
				new Date(invite.expiresAt),
			)
		: null;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<Avatar className="size-14 rounded-xl border">
					<AvatarImage
						src={logoUrl ?? undefined}
						alt={invite.organization.name}
					/>
					<AvatarFallback className="rounded-xl text-base font-bold">
						{orgInitials}
					</AvatarFallback>
				</Avatar>
				<div>
					<p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">
						You&apos;re invited to join
					</p>
					<p className="text-lg font-bold">{invite.organization.name}</p>
					<p className="text-sm text-muted-foreground">
						Role:{" "}
						<span className="font-medium text-foreground">
							{roleLabel}
						</span>
					</p>
				</div>
			</div>

			<div className="text-sm text-muted-foreground">
				<p>
					Sent to{" "}
					<span className="font-medium text-foreground">
						{invite.email}
					</span>
					{invite.inviter?.fullName && (
						<>
							{" "}
							by{" "}
							<span className="font-medium text-foreground">
								{invite.inviter.fullName}
							</span>
						</>
					)}
					{expiresLabel && (
						<span className="italic">
							{" "}
							· <Clock className="inline size-3" /> expires{" "}
							{expiresLabel}
						</span>
					)}
					.
				</p>
			</div>
		</div>
	);
}

