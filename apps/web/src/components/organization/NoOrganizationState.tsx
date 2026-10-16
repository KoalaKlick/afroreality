"use client";
// src/components/organization/NoOrganizationState.tsx

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateOrgDrawer } from "@/components/create-org-drawer";
import { EmptyState } from "@/components/shared/EmptyState";

interface NoOrganizationStateProps {
	readonly title?: string;
	readonly description?: string;
}

export function NoOrganizationState({
	title = "No Organization Found",
	description = "You are not currently part of any organization. Create an organization to manage your wallet, ticket revenue, and payout details.",
}: NoOrganizationStateProps) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	return (
		<div className="w-full max-w-2xl mx-auto py-8">
			<Card className="border border-border/60 shadow-xs">
				<CardContent className="pt-6">
					<EmptyState
						variant="payment"
						title={title}
						description={description}
						action={
							<Button
								onClick={() => setIsCreateOpen(true)}
								className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
							>
								<Plus className="size-4" />
								Create Organization
							</Button>
						}
					/>
				</CardContent>
			</Card>
			<CreateOrgDrawer open={isCreateOpen} onOpenChange={setIsCreateOpen} />
		</div>
	);
}
