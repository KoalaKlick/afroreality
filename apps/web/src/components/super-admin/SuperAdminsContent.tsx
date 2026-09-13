"use client";

import React, { useState, useTransition } from "react";
import {
	ShieldCheck,
	UserPlus,
	Trash2,
	Crown,
	Mail,
	UserX,
	Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { addPlatformAdminUser, removePlatformAdminUser } from "@/lib/server-functions/admin";

interface SuperAdminsContentProps {
	rootAdmin: string;
	admins: Array<{
		email: string;
		isRoot: boolean;
	}>;
}

export function SuperAdminsContent({
	rootAdmin,
	admins: initialAdmins,
}: SuperAdminsContentProps) {
	const [admins, setAdmins] = useState(initialAdmins);
	const [newEmail, setNewEmail] = useState("");
	const [removeEmail, setRemoveEmail] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleAddAdmin = (e: React.FormEvent) => {
		e.preventDefault();
		const clean = newEmail.trim().toLowerCase();
		if (!clean || !clean.includes("@")) {
			toast.error("Please enter a valid email address");
			return;
		}

		startTransition(async () => {
			const res = await addPlatformAdminUser({ email: clean });
			if (res.success) {
				toast.success(res.message);
				setAdmins((prev) => [...prev, { email: clean, isRoot: false }]);
				setNewEmail("");
			} else {
				toast.error(res.error || "Failed to add admin user");
			}
		});
	};

	const handleConfirmRemove = () => {
		if (!removeEmail) return;

		startTransition(async () => {
			const res = await removePlatformAdminUser({ email: removeEmail });
			if (res.success) {
				toast.success(res.message);
				setAdmins((prev) => prev.filter((a) => a.email !== removeEmail));
				setRemoveEmail(null);
			} else {
				toast.error(res.error || "Failed to remove admin user");
			}
		});
	};

	return (
		<div className="flex flex-col gap-6 max-w-4xl rounded-none shadow-none">
			{/* Header Notice */}
			<div className="p-4 border border-primary/30 bg-primary/5 flex items-start gap-3 rounded-none shadow-none">
				<div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-primary-foreground rounded-none shadow-none">
					<Crown className="h-4 w-4" />
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="text-sm font-bold text-foreground">
						Super Admin Authority & Delegation
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
						The root super admin (<strong className="text-foreground">{rootAdmin}</strong>) has top-level authority to designate or revoke platform administration rights for other team members.
					</p>
				</div>
			</div>

			{/* Add New Admin Form */}
			<Card className="border border-border bg-card rounded-none shadow-none">
				<CardHeader className="pb-3 border-b border-border rounded-none shadow-none">
					<CardTitle className="text-sm font-bold flex items-center gap-2">
						<UserPlus className="h-4 w-4 text-primary" />
						Authorize New Platform Administrator
					</CardTitle>
					<CardDescription className="text-xs">
						Enter the email address of the team member to grant access to the Super Admin platform.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4 rounded-none shadow-none">
					<form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1">
							<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								type="email"
								placeholder="colleague@fextiva.com"
								value={newEmail}
								onChange={(e) => setNewEmail(e.target.value)}
								className="pl-9 text-xs bg-background border-border rounded-none shadow-none"
								required
							/>
						</div>
						<Button
							type="submit"
							disabled={isPending || !newEmail.trim()}
							className="text-xs font-semibold shrink-0 rounded-none shadow-none"
						>
							<UserPlus className="h-3.5 w-3.5 mr-1.5" />
							{isPending ? "Adding..." : "Grant Admin Access"}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* List of Platform Admins */}
			<Card className="border border-border bg-card rounded-none shadow-none">
				<CardHeader className="pb-3 border-b border-border rounded-none shadow-none">
					<CardTitle className="text-sm font-bold flex items-center justify-between">
						<span>Authorized Platform Administrators</span>
						<Badge variant="outline" className="text-xs font-semibold rounded-none shadow-none border-border">
							{admins.length} Total Admin(s)
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0 rounded-none shadow-none">
					<div className="divide-y divide-border">
						{admins.map((admin) => (
							<div
								key={admin.email}
								className="p-4 flex items-center justify-between gap-3 text-xs"
							>
								<div className="flex items-center gap-3 min-w-0">
									<Avatar className="h-8 w-8 rounded-none shadow-none border border-border">
										<AvatarFallback
											className={`text-xs font-bold rounded-none ${
												admin.isRoot
													? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
													: "bg-primary/10 text-primary"
											}`}
										>
											{admin.email.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>

									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-bold text-foreground truncate">
												{admin.email}
											</span>
											{admin.isRoot && (
												<Badge
													variant="outline"
													className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[9px] uppercase font-extrabold rounded-none shadow-none"
												>
													Root Super Admin
												</Badge>
											)}
										</div>
										<p className="text-[11px] text-muted-foreground mt-0.5">
											{admin.isRoot
												? "Permanent primary root administrator"
												: "Authorized platform administrator"}
										</p>
									</div>
								</div>

								<div className="shrink-0">
									{admin.isRoot ? (
										<Badge variant="outline" className="text-[10px] text-muted-foreground rounded-none shadow-none border-border">
											<Lock className="h-3 w-3 mr-1" />
											Protected
										</Badge>
									) : (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setRemoveEmail(admin.email)}
											className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2.5 rounded-none shadow-none"
										>
											<Trash2 className="h-3.5 w-3.5 mr-1" />
											Remove
										</Button>
									)}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Confirmation Dialog for Removal - Flat & Square */}
			<Dialog open={!!removeEmail} onOpenChange={(open) => !open && setRemoveEmail(null)}>
				<DialogContent className="sm:max-w-md border border-border rounded-none shadow-none">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-destructive">
							<UserX className="h-5 w-5" />
							Revoke Platform Admin Access
						</DialogTitle>
						<DialogDescription className="text-xs">
							Are you sure you want to revoke platform admin privileges for <strong>{removeEmail}</strong>? They will no longer be able to access the Super Admin platform.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setRemoveEmail(null)}
							disabled={isPending}
							className="text-xs rounded-none shadow-none"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleConfirmRemove}
							disabled={isPending}
							className="text-xs font-semibold rounded-none shadow-none"
						>
							{isPending ? "Revoking..." : "Confirm Revocation"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
