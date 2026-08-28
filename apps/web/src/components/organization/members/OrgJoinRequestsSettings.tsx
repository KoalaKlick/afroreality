"use client";
// src/components/organization/members/OrgJoinRequestsSettings.tsx


import { useRouter } from 'next/navigation';
import {
	Clock,
	Loader2,
	MessageSquare,
	UserCheck,
	Users,
	UserX,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/hooks/use-permissions";
import { getAvatarUrl } from "@/lib/image-url-utils";
import { updateOrganizationSettings } from "@/lib/server-functions/organization";
import { resolveMembershipRequest } from "@/lib/server-functions/organization-join";
import { formatDate } from "@/lib/utils";

export interface JoinRequest {
	id: string;
	organizationId: string;
	userId: string;
	message: string | null;
	createdAt: string;
	user: {
		id: string;
		fullName: string | null;
		email: string;
		avatarUrl: string | null;
	};
}

interface OrgJoinRequestsSettingsProps {
	readonly organizationId: string;
	readonly allowJoinRequests: boolean;
	readonly requests: JoinRequest[];
}

export function OrgJoinRequestsSettings({
	organizationId,
	allowJoinRequests,
	requests,
}: OrgJoinRequestsSettingsProps) {
	const router = useRouter();
	const { canManageMembers, canManageSettings } = usePermissions();
	const [isPending, startTransition] = useTransition();
	const [isTogglingJoin, startToggleTransition] = useTransition();
	const [joinEnabled, setJoinEnabled] = useState(allowJoinRequests);

	const handleToggleJoinRequests = (checked: boolean) => {
		setJoinEnabled(checked);
		startToggleTransition(async () => {
			try {
				await updateOrganizationSettings({
					data: { id: organizationId, allowJoinRequests: checked },
				});
				toast.success(
					checked ? "Join requests enabled." : "Join requests disabled.",
				);
				await router.refresh();
			} catch (error) {
				setJoinEnabled(!checked);
				toast.error(
					error instanceof Error ? error.message : "Failed to update setting.",
				);
			}
		});
	};

	const handleResolve = (requestId: string, action: "approve" | "reject") => {
		startTransition(async () => {
			try {
				await resolveMembershipRequest({
					data: { requestId, action },
				});
				toast.success(
					action === "approve" ? "Member approved!" : "Request rejected.",
				);
				await router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to process request.",
				);
			}
		});
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Join Request Setting
					</CardTitle>
					<CardDescription className="text-xs">
						Control whether other organizers can see a "Request to Join" button
						on your organization's public page. If enabled, anyone can request
						to join and you'll be able to review and approve/deny requests
						below.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div>
							<Label
								htmlFor="allow-join-toggle"
								className="text-sm font-medium"
							>
								Allow join requests
							</Label>
							<p className="text-xs text-muted-foreground mt-0.5">
								{joinEnabled
									? "Anyone can request to join. You review and approve requests."
									: "The join button is hidden on your public page."}
							</p>
						</div>
						<Switch
							id="allow-join"
							checked={joinEnabled}
							onCheckedChange={handleToggleJoinRequests}
							disabled={isTogglingJoin || !canManageSettings}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Join Requests
						{requests.length > 0 && (
							<Badge variant="outline" className="ml-1">
								{requests.length}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{requests.length === 0 ? (
						<EmptyState
							variant="users"
							title="No pending requests"
							description="New join requests will appear here."
							className="py-12"
						/>
					) : (
						<div className="space-y-3">
							{requests.map((req) => (
								<div
									key={req.id}
									className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
								>
									<Avatar className="size-10 rounded-md mt-0.5">
										<AvatarImage
											src={getAvatarUrl(req.user?.avatarUrl) ?? ""}
											alt={req.user?.fullName ?? "User avatar"}
										/>
										<AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
											{req.user?.fullName?.[0] || "U"}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm">
											{req.user?.fullName ?? "Unknown User"}
										</p>
										<p className="text-xs text-muted-foreground">
											{req.user?.email}
										</p>
										{req.message && (
											<div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground bg-muted/50 rounded p-2">
												<MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
												<span className="line-clamp-2">{req.message}</span>
											</div>
										)}
										<p className="text-xs text-muted-foreground mt-1.5">
											Requested {formatDate(req.createdAt)}
										</p>
									</div>
									{canManageMembers && (
										<div className="flex gap-1.5 shrink-0">
											<Button
												size="sm"
												variant="outline"
												className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
												onClick={() => handleResolve(req.id, "approve")}
												disabled={isPending}
											>
												{isPending ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<UserCheck className="h-4 w-4" />
												)}
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-destructive border-destructive/20 hover:bg-destructive/5"
												onClick={() => handleResolve(req.id, "reject")}
												disabled={isPending}
											>
												{isPending ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<UserX className="h-4 w-4" />
												)}
											</Button>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
