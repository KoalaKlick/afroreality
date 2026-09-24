import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAdminSecurityDeposits } from "@/lib/server-functions/admin";
import { AdminDepositsContent } from "@/components/admin/AdminDepositsContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Event Security Deposits & Escrow - Super Admin Platform",
	description: "Monitor and manage refundable publishing deposits, escrow duration, and 1-click Paystack refunds.",
};

export default async function SuperAdminDepositsPage() {
	const data = await getAdminSecurityDeposits();

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<AdminDepositsContent
				deposits={serializeJsonSafe(data.deposits)}
				totalHeldAmount={data.totalHeldAmount}
				totalHeldCount={data.totalHeldCount}
				dueRefundsCount={data.dueRefundsCount}
				totalRefundedAmount={data.totalRefundedAmount}
				totalRefundedCount={data.totalRefundedCount}
				depositRules={serializeJsonSafe(data.depositRules)}
			/>
		</Suspense>
	);
}
