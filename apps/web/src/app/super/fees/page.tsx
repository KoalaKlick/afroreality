import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAdminPlatformFees } from "@/lib/server-functions/admin";
import { AdminFeesContent } from "@/components/admin/AdminFeesContent";
import { PaymentGatewaySettingsContent } from "@/components/admin/PaymentGatewaySettingsContent";
import { serializeJsonSafe } from "@/lib/utils";
import { SuperAdminConfigTabs } from "@/components/super-admin/SuperAdminConfigTabs";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Fees & Gateways - Super Admin Platform",
	description:
		"Manage platform take rates, gateway processing surcharges, and payment routing.",
};

export default async function SuperAdminFeesPage() {
	const data = await getAdminPlatformFees();

	return (
		<SuperAdminConfigTabs
			gateways={
				<Suspense
					fallback={
						<div className="flex justify-center py-16">
							<Loader2 className="size-6 animate-spin text-muted-foreground" />
						</div>
					}
				>
					<PaymentGatewaySettingsContent
						gatewayConfigs={serializeJsonSafe(data.gatewayConfigs)}
						routingDefaults={serializeJsonSafe(data.routingDefaults)}
						eventRoutings={serializeJsonSafe(data.eventRoutings)}
					/>
				</Suspense>
			}
			fees={
				<Suspense
					fallback={
						<div className="flex justify-center py-16">
							<Loader2 className="size-6 animate-spin text-muted-foreground" />
						</div>
					}
				>
					<AdminFeesContent
						embedded
						globalFees={serializeJsonSafe(data.globalFees)}
						orgOverrides={serializeJsonSafe(data.orgOverrides)}
						paystackConfig={serializeJsonSafe(data.paystackConfig)}
						withdrawalRules={serializeJsonSafe(data.withdrawalRules)}
						depositRules={serializeJsonSafe(data.depositRules)}
						organizations={serializeJsonSafe(data.organizations)}
					/>
				</Suspense>
			}
		/>
	);
}
