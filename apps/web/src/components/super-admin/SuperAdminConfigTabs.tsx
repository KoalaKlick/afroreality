"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SuperAdminConfigTabsProps {
	readonly gateways: ReactNode;
	readonly fees: ReactNode;
}

/** Configuration hub: gateways / routing vs platform take rates. */
export function SuperAdminConfigTabs({
	gateways,
	fees,
}: SuperAdminConfigTabsProps) {
	return (
		<div className="flex flex-col gap-5">
			<Tabs defaultValue="gateways" className="w-full">
				<TabsList className="h-9 bg-muted/50 border border-border/70 p-0.5 rounded-lg w-full sm:w-auto justify-start">
					<TabsTrigger
						value="gateways"
						className="text-xs font-medium rounded-md px-3 data-[state=active]:bg-background"
					>
						Payment gateways
					</TabsTrigger>
					<TabsTrigger
						value="fees"
						className="text-xs font-medium rounded-md px-3 data-[state=active]:bg-background"
					>
						Platform fees
					</TabsTrigger>
				</TabsList>

				<TabsContent value="gateways" className="mt-5 focus-visible:outline-none">
					{gateways}
				</TabsContent>
				<TabsContent value="fees" className="mt-5 focus-visible:outline-none">
					{fees}
				</TabsContent>
			</Tabs>
		</div>
	);
}
