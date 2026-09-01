"use client";
// src/components/organization/members/OrgMembersClient.tsx

import { Mail, Plus, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { RolePermissionsManualDrawer } from "@/components/organization/shared";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/use-permissions";
import { InviteMemberDialog } from "./InviteMemberDialog";
import type { SentInvitation } from "./OrgInvitationsSettings";
import { OrgInvitationsSettings } from "./OrgInvitationsSettings";
import type { JoinRequest } from "./OrgJoinRequestsSettings";
import { OrgJoinRequestsSettings } from "./OrgJoinRequestsSettings";
import type { OrgMember } from "./OrgMembersTable";
import { OrgMembersTable } from "./OrgMembersTable";
import { getEffectiveStatus } from "./utils";

interface OrgMembersClientProps {
	readonly organizationId: string;
	readonly organizationName: string;
	readonly allowJoinRequests: boolean;
	readonly members: OrgMember[];
	readonly totalMembers: number;
	readonly joinRequests: JoinRequest[];
	readonly invitations: SentInvitation[];
	readonly currentUserId: string;
	readonly canManageMembers?: boolean;
	readonly onInviteClick?: () => void;
}

export function OrgMembersClient({
	organizationId,
	organizationName,
	allowJoinRequests,
	members,
	totalMembers,
	joinRequests,
	invitations,
	currentUserId,
	canManageMembers,
	onInviteClick,
}: OrgMembersClientProps) {
	const { canManageMembers: userCanManage } = usePermissions();
	const canManage = canManageMembers ?? userCanManage;

	const [isInviteOpen, setIsInviteOpen] = useState(false);

	const pendingCount = invitations.filter(
		(inv) => getEffectiveStatus(inv.status, inv.expiresAt) === "pending",
	).length;

	const defaultTab = "members";

	return (
		<>
			<PageHeader
				breadcrumbs={[
					{ label: "Organization", href: "/organization/manage" },
					{ label: "Members" },
				]}
			/>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Tabs defaultValue={defaultTab} className="space-y-6">
					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
										<Users className="h-6 w-6" />
										Team Members
									</CardTitle>
									<CardDescription className="mt-1">
										Manage members, invitations, and join requests for{" "}
										{organizationName}.
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									{canManage && (
										<Button
											size="sm"
											onClick={() => {
												if (onInviteClick) onInviteClick();
												else setIsInviteOpen(true);
											}}
											className="gap-1.5 shadow-xs"
										>
											<UserPlus className="h-4 w-4" />
											Invite Member
										</Button>
									)}
									<RolePermissionsManualDrawer />
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<TabsList variant="brand" className="flex overflow-x-auto w-full">
								<TabsTrigger variant="brand" value="members" className="gap-1.5">
									<Users className="h-4 w-4" />
									<span>Members</span>
									<span className="ml-1 text-xs font-mono opacity-70">
										({totalMembers})
									</span>
								</TabsTrigger>
								<TabsTrigger
									variant="brand"
									value="invitations"
									className="gap-1.5 relative"
								>
									<Mail className="h-4 w-4" />
									<span>Invitations</span>
									{pendingCount > 0 && (
										<span className="h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
											{pendingCount}
										</span>
									)}
								</TabsTrigger>
								<TabsTrigger
									variant="brand"
									value="requests"
									className="gap-1.5 relative"
								>
									<UserPlus className="h-4 w-4" />
									<span>Requests</span>
									{joinRequests.length > 0 && (
										<span className="h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
											{joinRequests.length}
										</span>
									)}
								</TabsTrigger>
							</TabsList>
						</CardContent>
					</Card>

					<TabsContent value="members">
						<OrgMembersTable
							organizationId={organizationId}
							members={members}
							total={totalMembers}
							currentUserId={currentUserId}
						/>
					</TabsContent>

					<TabsContent value="invitations">
						<OrgInvitationsSettings
							organizationId={organizationId}
							invitations={invitations}
						/>
					</TabsContent>

					<TabsContent value="requests">
						<OrgJoinRequestsSettings
							organizationId={organizationId}
							allowJoinRequests={allowJoinRequests}
							requests={joinRequests}
						/>
					</TabsContent>
				</Tabs>
			</div>

			{/* Invite Member Modal Dialog */}
			<InviteMemberDialog
				open={isInviteOpen}
				onOpenChange={setIsInviteOpen}
				organizationId={organizationId}
			/>
		</>
	);
}

export type { OrgMember, SentInvitation, JoinRequest };
