"use client";
// src/components/organization/wallet/OrgWalletClient.tsx


import { ArrowLeftRight, Banknote, Wallet as WalletIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Transaction, Wallet } from "@/lib/types/payment";
import { OrgPayoutSettings } from "./OrgPayoutSettings";
import { TransactionsTable } from "./TransactionsTable";
import { WalletBalanceSummary } from "./WalletBalanceSummary";

interface OrgWalletClientProps {
	readonly organization: {
		id: string;
		name: string;
		paystackBankCode?: string | null;
		paystackAccountNumber?: string | null;
		paystackAccountName?: string | null;
		subaccountCode?: string | null;
	};
	readonly wallet: Wallet | null;
	readonly transactions: Transaction[];
	readonly totalTransactions: number;
}

export function OrgWalletClient({
	organization,
	wallet,
	transactions,
	totalTransactions,
}: OrgWalletClientProps) {
	return (
		<>
			<PageHeader
				breadcrumbs={[
					{ label: "Organization", href: "/organization/manage" },
					{ label: "Wallet & Payouts" },
				]}
			/>

		<div className="flex flex-1 flex-col gap-6 p-6">
			<Tabs defaultValue="payout" className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<WalletIcon className="h-6 w-6" />
							Wallet & Payouts
						</CardTitle>
					</CardHeader>
					<CardContent>
						<TabsList variant="afro" className="flex overflow-x-auto w-full">
							<TabsTrigger variant="afro" value="payout" className="gap-1.5">
								<Banknote className="h-4 w-4" />
								<span>Payout Account</span>
							</TabsTrigger>
							<TabsTrigger variant="afro" value="transactions" className="gap-1.5">
								<ArrowLeftRight className="h-4 w-4" />
								<span>Transactions</span>
							</TabsTrigger>
						</TabsList>
					</CardContent>
				</Card>

				<TabsContent value="payout" className="space-y-6">
					{wallet && (
						<WalletBalanceSummary
							key={organization.id}
							organizationId={organization.id}
							availableBalance={wallet.balance}
							pendingBalance={(wallet.pendingCredits ?? 0) - (wallet.pendingDebits ?? 0)}
							totalPayouts={wallet.balance + (wallet.pendingCredits ?? 0)}
							currency={wallet.currency}
						/>
					)}

					<OrgPayoutSettings key={organization.id} organization={organization} />
				</TabsContent>

				<TabsContent value="transactions" className="space-y-6">
					<TransactionsTable
						key={organization.id}
						transactions={transactions}
						total={totalTransactions}
					/>
				</TabsContent>
			</Tabs>
		</div>
		</>
	);
}
