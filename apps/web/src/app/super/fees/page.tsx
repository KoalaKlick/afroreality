import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAdminPlatformFees } from "@/lib/server-functions/admin";
import { AdminFeesContent } from "@/components/admin/AdminFeesContent";
import { PaymentGatewaySettingsContent } from "@/components/admin/PaymentGatewaySettingsContent";
import { serializeJsonSafe } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Platform Fees & Payment Gateways - Super Admin Platform",
	description: "Manage platform take rates, gateway processing surcharges, default payment routing, and per-event gateway overrides.",
};

export default async function SuperAdminFeesPage() {
	const data = await getAdminPlatformFees();

	return (
		<>
			<Suspense
				fallback={
					<div className="flex justify-center py-24">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				}
			>
				<PaymentGatewaySettingsContent
					gatewayConfigs={serializeJsonSafe(data.gatewayConfigs)}
					routingDefaults={serializeJsonSafe(data.routingDefaults)}
					eventRoutings={serializeJsonSafe(data.eventRoutings)}
				/>
			</Suspense>

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
					depositRules={serializeJsonSafe(data.depositRules)}
					organizations={serializeJsonSafe(data.organizations)}
				/>
			</Suspense>
		</>
	);
}
