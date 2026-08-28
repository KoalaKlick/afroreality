"use client";
// src/components/organization/shared/RolePermissionsManualDialog.tsx
// Interactive single-page manual drawer explaining role permissions across Owner (Creator), Admin, and Member roles.


import {
	CheckCircle2,
	Crown,
	Eye,
	HelpCircle,
	ShieldCheck,
	UserCheck,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetBody,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface PermissionRow {
	feature: string;
	category: string;
	description: string;
	owner: { allowed: boolean; note?: string };
	admin: { allowed: boolean; note?: string; viewOnly?: boolean };
	member: { allowed: boolean; note?: string; viewOnly?: boolean };
}

const PERMISSIONS_DATA: PermissionRow[] = [
	{
		feature: "View Organization Pages",
		category: "Access & Visibility",
		description: "Browse dashboard, events list, general settings, team members, and wallet.",
		owner: { allowed: true, note: "Full Access" },
		admin: { allowed: true, note: "Full Access" },
		member: { allowed: true, note: "Full View Access", viewOnly: true },
	},
	{
		feature: "General Organization Settings",
		category: "Administration",
		description: "Edit organization name, branding logo, banner, theme colors, and social links.",
		owner: { allowed: true, note: "Can Edit" },
		admin: { allowed: true, note: "Can Edit" },
		member: { allowed: false, note: "View-Only", viewOnly: true },
	},
	{
		feature: "Event Creation & Publishing",
		category: "Events",
		description: "Create new voting, ticketed, standard, or hybrid events and publish them.",
		owner: { allowed: true, note: "Full CRUD" },
		admin: { allowed: true, note: "Full CRUD" },
		member: { allowed: false, note: "View-Only", viewOnly: true },
	},
	{
		feature: "Event Editing & Deletion",
		category: "Events",
		description: "Modify event details, ticket tiers, voting categories, or delete draft events.",
		owner: { allowed: true, note: "Full CRUD" },
		admin: { allowed: true, note: "Full CRUD" },
		member: { allowed: false, note: "View-Only", viewOnly: true },
	},
	{
		feature: "Invite Team Members",
		category: "Team Management",
		description: "Send invitation emails to new collaborators to join the organization as Admin or Member.",
		owner: { allowed: true, note: "Can Invite" },
		admin: { allowed: true, note: "Can Invite" },
		member: { allowed: false, note: "Restricted" },
	},
	{
		feature: "Manage Member Roles",
		category: "Team Management",
		description: "Promote members to Admin or demote Admins to Member (Owner role is locked to creator).",
		owner: { allowed: true, note: "Admin & Member" },
		admin: { allowed: true, note: "Admin & Member" },
		member: { allowed: false, note: "Restricted" },
	},
	{
		feature: "Remove Team Members",
		category: "Team Management",
		description: "Remove team members from the organization (Owner/Creator cannot be removed).",
		owner: { allowed: true, note: "Can Remove" },
		admin: { allowed: true, note: "Can Remove (Non-Owner)" },
		member: { allowed: false, note: "Restricted" },
	},
	{
		feature: "Approve / Reject Join Requests",
		category: "Team Management",
		description: "Review pending membership requests and toggle join requests.",
		owner: { allowed: true, note: "Can Manage" },
		admin: { allowed: true, note: "Can Manage" },
		member: { allowed: false, note: "View-Only", viewOnly: true },
	},
	{
		feature: "View Wallet & Transactions",
		category: "Finance & Wallet",
		description: "Inspect live wallet balance, transaction ledger, and payment receipts.",
		owner: { allowed: true, note: "Full View" },
		admin: { allowed: true, note: "Full View" },
		member: { allowed: true, note: "Full View", viewOnly: true },
	},
	{
		feature: "Configure Payout Account",
		category: "Finance & Wallet",
		description: "Set up or change bank account or Mobile Money number for settlements.",
		owner: { allowed: true, note: "Creator Only" },
		admin: { allowed: false, note: "Restricted" },
		member: { allowed: false, note: "Restricted", viewOnly: true },
	},
	{
		feature: "Request Wallet Withdrawal",
		category: "Finance & Wallet",
		description: "Initiate payout withdrawals to the configured bank or Mobile Money account.",
		owner: { allowed: true, note: "Creator Only" },
		admin: { allowed: false, note: "Restricted" },
		member: { allowed: false, note: "Restricted" },
	},
];

export interface RolePermissionsManualDrawerProps {
	readonly trigger?: React.ReactNode;
	readonly defaultOpen?: boolean;
	readonly variant?: "outline" | "default" | "ghost" | "secondary";
	readonly size?: "default" | "sm" | "lg" | "icon";
	readonly className?: string;
}

export function RolePermissionsManualDrawer({
	trigger,
	defaultOpen = false,
	variant = "outline",
	size = "sm",
	className,
}: RolePermissionsManualDrawerProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				{trigger ?? (
					<Button
						variant={variant}
						size={size}
						className={cn("gap-1.5 text-xs font-medium shadow-none", className)}
					>
						<HelpCircle className="h-4 w-4 text-primary" />
						<span>Role Permissions Manual</span>
					</Button>
				)}
			</SheetTrigger>

			<SheetContent
				side="right"
				className="w-full sm:max-w-2xl md:max-w-3xl overflow-y-auto p-6 sm:p-8"
			>
				<SheetHeader className="pb-4 border-b">
					<SheetTitle className="text-xl sm:text-2xl font-bold tracking-tight">
						Organization Roles & Permissions
					</SheetTitle>
					<SheetDescription className="text-sm text-muted-foreground">
						Comprehensive permissions matrix detailing operational CRUD capabilities and financial controls across all organization roles.
					</SheetDescription>
				</SheetHeader>

				<SheetBody className="p-0 overflow-y-auto space-y-4">
					{/* Permissions Matrix Table */}
					<div className="overflow-hidden ">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs border-collapse">
								<thead>
									<tr className="border-b bg-background text-muted-foreground font-semibold">
										<th className="p-3 pl-4">System Capability</th>
										<th className="p-3 text-center w-32">
											<div className="flex flex-col items-center justify-center text-amber-600 dark:text-amber-400">
												<div className="flex items-center gap-1 font-bold">
													<Crown className="h-3.5 w-3.5" />
													<span>Owner</span>
												</div>
												<span className="text-[10px] font-normal text-muted-foreground">
													(Creator)
												</span>
											</div>
										</th>
										<th className="p-3 text-center w-28">
											<div className="flex flex-col items-center justify-center text-sky-600 dark:text-sky-400">
												<div className="flex items-center gap-1 font-bold">
													<ShieldCheck className="h-3.5 w-3.5" />
													<span>Admin</span>
												</div>
												<span className="text-[10px] font-normal text-muted-foreground">
													Manager
												</span>
											</div>
										</th>
										<th className="p-3 text-center w-28">
											<div className="flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-400">
												<div className="flex items-center gap-1 font-bold">
													<UserCheck className="h-3.5 w-3.5" />
													<span>Member</span>
												</div>
												<span className="text-[10px] font-normal text-muted-foreground">
													Collaborator
												</span>
											</div>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border/50">
									{PERMISSIONS_DATA.map((row, idx) => (
										<tr
											key={row.feature}
											className={cn(
												"hover:bg-muted/30 transition-colors",
												idx % 2 === 0 ? "bg-card" : "bg-muted/10",
											)}
										>
											<td className="p-3 pl-4">
												<p className="font-semibold text-foreground text-xs">
													{row.feature}
												</p>
												<p className="text-[11px] text-muted-foreground mt-0.5">
													{row.description}
												</p>
											</td>
											{/* Owner Column */}
											<td className="p-3 text-center align-middle">
												<div className="flex flex-col items-center justify-center gap-1">
													<CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
													<span className="text-[10px] text-muted-foreground font-medium">
														{row.owner.note ?? "Allowed"}
													</span>
												</div>
											</td>
											{/* Admin Column */}
											<td className="p-3 text-center align-middle">
												<div className="flex flex-col items-center justify-center gap-1">
													{row.admin.allowed ? (
														<CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
													) : row.admin.viewOnly ? (
														<Eye className="h-4 w-4 text-amber-500 shrink-0" />
													) : (
														<XCircle className="h-4 w-4 text-rose-500 shrink-0" />
													)}
													<span className="text-[10px] text-muted-foreground font-medium">
														{row.admin.note}
													</span>
												</div>
											</td>
											{/* Member Column */}
											<td className="p-3 text-center align-middle">
												<div className="flex flex-col items-center justify-center gap-1">
													{row.member.viewOnly ? (
														<Eye className="h-4 w-4 text-sky-500 shrink-0" />
													) : row.member.allowed ? (
														<CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
													) : (
														<XCircle className="h-4 w-4 text-muted-foreground/60 shrink-0" />
													)}
													<span className="text-[10px] text-muted-foreground font-medium">
														{row.member.note}
													</span>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Legend & Creator Rule Callout */}
					<div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
						<span className="font-semibold text-foreground">Legend:</span>
						<span className="flex items-center gap-1">
							<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Full CRUD / Action
						</span>
						<span className="flex items-center gap-1">
							<Eye className="h-3.5 w-3.5 text-sky-500" /> View-Only Access
						</span>
						<span className="flex items-center gap-1">
							<XCircle className="h-3.5 w-3.5 text-rose-500" /> Action Restricted
						</span>
					</div>

					<div className="p-3 rounded-lg bg-amber-500/5 text-xs text-muted-foreground">
						<p>
							<strong className="text-foreground">Note:</strong> The{" "}
							<span className="font-semibold text-amber-600 dark:text-amber-400">
								Owner
							</span>{" "}
							role is strictly tied to the organization creator and has exclusive authority over financial withdrawals and payout account management. Collaborators can be invited or assigned as{" "}
							<span className="font-semibold text-sky-600 dark:text-sky-400">
								Admin
							</span>{" "}
							or{" "}
							<span className="font-semibold text-emerald-600 dark:text-emerald-400">
								Member
							</span>
							.
						</p>
					</div>
				</SheetBody>
			</SheetContent>
		</Sheet>
	);
}

// Backward-compatible alias
export const RolePermissionsManualDialog = RolePermissionsManualDrawer;
