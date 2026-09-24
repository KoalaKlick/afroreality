import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAdminPlatformFees } from "@/lib/server-functions/admin";
import { AdminFeesContent } from "@/components/admin/AdminFeesContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Platform Fees & Gateway Rates - Super Admin Platform",
	description: "Manage global baseline platform take rates, Paystack processing surcharges, and custom organization fee overrides.",
};

export default async function SuperAdminFeesPage() {
	const data = await getAdminPlatformFees();

	return (
		<Suspense
			fallback={
				<div className="flex justify-center py-24">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<AdminFeesContent
				globalFees={serializeJsonSafe(data.globalFees)}
				orgOverrides={serializeJsonSafe(data.orgOverrides)}
				paystackConfig={serializeJsonSafe(data.paystackConfig)}
				withdrawalRules={serializeJsonSafe(data.withdrawalRules)}
				organizations={serializeJsonSafe(data.organizations)}
			/>
		</Suspense>
	);
}
