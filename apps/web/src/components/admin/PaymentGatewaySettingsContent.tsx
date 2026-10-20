"use client";

import React, { useState, useTransition } from "react";
import {
	CreditCard,
	Route,
	Save,
	Search,
	ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	adminUpdateGatewayFeeSettings,
	adminUpdatePaymentRoutingDefaults,
	adminUpdateEventPaymentRouting,
	type AdminGatewayFeeConfig,
	type AdminEventPaymentRouting,
} from "@/lib/server-functions/admin";

const GATEWAYS = ["paystack", "junipay", "hubtel"] as const;
type Gateway = (typeof GATEWAYS)[number];
type Channel = "ussd" | "web";

interface Props {
	gatewayConfigs: {
		paystack: AdminGatewayFeeConfig;
		junipay: AdminGatewayFeeConfig;
		hubtel: AdminGatewayFeeConfig;
	};
	routingDefaults: {
		gateway: string;
		channel: string;
	};
	eventRoutings: AdminEventPaymentRouting[];
}

const GATEWAY_LABEL: Record<Gateway, string> = {
	paystack: "Paystack",
	junipay: "JuniPay",
	hubtel: "Hubtel",
};

function gatewayLabel(value: string | null | undefined): string {
	if (value === "junipay") return "JuniPay";
	if (value === "hubtel") return "Hubtel";
	if (value === "paystack") return "Paystack";
	return "Default";
}

export function PaymentGatewaySettingsContent({
	gatewayConfigs,
	routingDefaults,
	eventRoutings,
}: Props) {
	const [isPending, startTransition] = useTransition();

	const [fees, setFees] = useState<Record<Gateway, { feeRate: string; feeCap: string }>>({
		paystack: { feeRate: String(gatewayConfigs.paystack.feeRate * 100), feeCap: String(gatewayConfigs.paystack.feeCap) },
		junipay: { feeRate: String(gatewayConfigs.junipay.feeRate * 100), feeCap: String(gatewayConfigs.junipay.feeCap) },
		hubtel: { feeRate: String(gatewayConfigs.hubtel.feeRate * 100), feeCap: String(gatewayConfigs.hubtel.feeCap) },
	});

	const [defaults, setDefaults] = useState({
		gateway: routingDefaults.gateway as Gateway,
		channel: routingDefaults.channel as Channel,
	});

	const [search, setSearch] = useState("");
	const [routing, setRouting] = useState<Record<string, { gateway: string; channel: string }>>(
		() =>
			Object.fromEntries(
				eventRoutings.map((ev) => [
					ev.id,
					{ gateway: ev.paymentGateway || "inherit", channel: ev.paymentChannel || "inherit" },
				]),
			),
	);

	const saveGatewayFee = (gateway: Gateway) => {
		startTransition(async () => {
			const res = await adminUpdateGatewayFeeSettings({
				gateway,
				feeRate: Number(fees[gateway].feeRate),
				feeCap: Number(fees[gateway].feeCap),
			});
			if (res.success) toast.success(res.message);
			else toast.error(res.error || "Failed to update gateway fee");
		});
	};

	const saveDefaults = () => {
		startTransition(async () => {
			const res = await adminUpdatePaymentRoutingDefaults({
				gateway: defaults.gateway,
				channel: defaults.channel,
			});
			if (res.success) toast.success(res.message);
			else toast.error(res.error || "Failed to update routing defaults");
		});
	};

	const saveEventRouting = (eventId: string) => {
		const r = routing[eventId];
		if (!r) return;
		startTransition(async () => {
			const res = await adminUpdateEventPaymentRouting({
				eventId,
				gateway: r.gateway === "inherit" ? null : (r.gateway as Gateway),
				channel: r.channel === "inherit" ? null : (r.channel as Channel),
			});
			if (res.success) toast.success(res.message);
			else toast.error(res.error || "Failed to update event routing");
		});
	};

	const filteredEvents = eventRoutings.filter((ev) => {
		const q = search.toLowerCase();
		return (
			ev.title.toLowerCase().includes(q) ||
			(ev.ussdCode || "").includes(q) ||
			(ev.organization?.name || "").toLowerCase().includes(q)
		);
	});

	return (
		<div className="space-y-6">
			{/* Gateway fees */}
			<Card className="rounded-xl border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base font-bold flex items-center gap-2">
						<CreditCard className="size-4 text-primary" />
						Gateway Processing Fees
					</CardTitle>
					<CardDescription className="text-xs">
						Each gateway charges differently. Set the processing rate (absorbed by the buyer) and cap per gateway.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4 grid gap-4 sm:grid-cols-3">
					{GATEWAYS.map((gw) => (
						<div key={gw} className="space-y-3 rounded-lg border border-border/80 p-4">
							<div className="flex items-center justify-between">
								<span className="text-sm font-bold">{GATEWAY_LABEL[gw]}</span>
								{gw === "paystack" ? (
									<Badge variant="outline" className="text-[10px] uppercase">Default</Badge>
								) : null}
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-semibold">Processing Rate (%)</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={fees[gw].feeRate}
									onChange={(e) =>
										setFees((prev) => ({
											...prev,
											[gw]: { ...prev[gw], feeRate: e.target.value },
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-semibold">Fee Cap (GHS)</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={fees[gw].feeCap}
									onChange={(e) =>
										setFees((prev) => ({
											...prev,
											[gw]: { ...prev[gw], feeCap: e.target.value },
										}))
									}
								/>
							</div>
							<Button
								size="sm"
								variant="outline"
								className="w-full text-xs border-border/80 cursor-pointer"
								onClick={() => saveGatewayFee(gw)}
								disabled={isPending}
							>
								<Save className="size-3.5 mr-1.5" />
								Save {GATEWAY_LABEL[gw]}
							</Button>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Routing defaults */}
			<Card className="rounded-xl border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base font-bold flex items-center gap-2">
						<Route className="size-4 text-primary" />
						Default Payment Routing
					</CardTitle>
					<CardDescription className="text-xs">
						Events without an explicit override use these defaults.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4 grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label className="text-xs font-semibold">Default Gateway</Label>
						<Select
							value={defaults.gateway}
							onValueChange={(v) => setDefaults((p) => ({ ...p, gateway: v as Gateway }))}
						>
							<SelectTrigger className="h-9 text-xs">
								<SelectValue placeholder="Select gateway" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="paystack">Paystack</SelectItem>
								<SelectItem value="junipay">JuniPay</SelectItem>
								<SelectItem value="hubtel">Hubtel</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label className="text-xs font-semibold">Default Channel</Label>
						<Select
							value={defaults.channel}
							onValueChange={(v) => setDefaults((p) => ({ ...p, channel: v as Channel }))}
						>
							<SelectTrigger className="h-9 text-xs">
								<SelectValue placeholder="Select channel" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="web">Web</SelectItem>
								<SelectItem value="ussd">USSD</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="sm:col-span-2">
						<Button
							size="sm"
							className="text-xs cursor-pointer"
							onClick={saveDefaults}
							disabled={isPending}
						>
							<Save className="size-3.5 mr-1.5" />
							Save Defaults
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Per-event routing */}
			<Card className="rounded-xl border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm">
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base font-bold flex items-center gap-2">
						<ArrowLeftRight className="size-4 text-primary" />
						Per-Event Payment Routing
					</CardTitle>
					<CardDescription className="text-xs">
						Override the gateway or channel for individual events. &ldquo;Default&rdquo; inherits the platform default.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4 space-y-4">
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							className="pl-8 h-9 text-xs"
							placeholder="Search by title, USSD code, or organizer..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						{filteredEvents.length === 0 ? (
							<p className="text-xs text-muted-foreground text-center py-6">
								No events found.
							</p>
						) : (
							filteredEvents.map((ev) => {
								const r = routing[ev.id] || { gateway: "inherit", channel: "inherit" };
								return (
									<div
										key={ev.id}
										className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center rounded-lg border border-border/80 p-3"
									>
										<div className="min-w-0">
											<p className="text-sm font-semibold truncate">{ev.title}</p>
											<p className="text-[11px] text-muted-foreground truncate">
												{ev.organization?.name || "—"}
												{ev.ussdCode ? ` · USSD *928*920*${ev.ussdCode}#` : ""}
											</p>
										</div>

										<Select
											value={r.gateway}
											onValueChange={(v) =>
												setRouting((prev) => ({
													...prev,
													[ev.id]: {
														...(prev[ev.id] || { gateway: "inherit", channel: "inherit" }),
														gateway: v,
													},
												}))
											}
										>
											<SelectTrigger className="h-8 w-[140px] text-xs">
												<SelectValue placeholder="Gateway" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="inherit">Default</SelectItem>
												<SelectItem value="paystack">Paystack</SelectItem>
												<SelectItem value="junipay">JuniPay</SelectItem>
												<SelectItem value="hubtel">Hubtel</SelectItem>
											</SelectContent>
										</Select>

										<Select
											value={r.channel}
											onValueChange={(v) =>
												setRouting((prev) => ({
													...prev,
													[ev.id]: {
														...(prev[ev.id] || { gateway: "inherit", channel: "inherit" }),
														channel: v,
													},
												}))
											}
										>
											<SelectTrigger className="h-8 w-[120px] text-xs">
												<SelectValue placeholder="Channel" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="inherit">Default</SelectItem>
												<SelectItem value="web">Web</SelectItem>
												<SelectItem value="ussd">USSD</SelectItem>
											</SelectContent>
										</Select>

										<Button
											size="sm"
											variant="outline"
											className="text-xs border-border/80 cursor-pointer"
											onClick={() => saveEventRouting(ev.id)}
											disabled={isPending}
										>
											Save
										</Button>
									</div>
								);
							})
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Re-export helper for display labels elsewhere if needed.
export { gatewayLabel };
