import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAdminWalletsList } from "@/lib/dal/admin";
import { AdminWalletsContent } from "@/components/admin/AdminWalletsContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Wallets & Payouts - Super Admin Platform",
	description: "Manage and oversee platform escrow balances, payouts, and organization wallet status",
};

export default async function SuperAdminWalletsPage() {
	const data = await getAdminWalletsList();

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<AdminWalletsContent
				wallets={serializeJsonSafe(data.wallets)}
				recentPayouts={serializeJsonSafe(data.recentPayouts)}
				floatSummary={serializeJsonSafe(data.floatSummary)}
			/>
		</Suspense>
	);
}
